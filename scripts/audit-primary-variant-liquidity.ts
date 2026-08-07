/* eslint-disable no-console */

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function coerceBaseUrl(value: string): string {
    const trimmed = value.trim().replace(/\/$/, '');
    assert(trimmed.length > 0, 'API_BASE_URL must be a non-empty string');

    const hasScheme = /^https?:\/\//i.test(trimmed);
    const withScheme = hasScheme
        ? trimmed
        : trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')
          ? `http://${trimmed}`
          : `https://${trimmed}`;

    try {
        return new URL(withScheme).toString().replace(/\/$/, '');
    } catch {
        throw new Error(`API_BASE_URL is not a valid URL: ${value}`);
    }
}

async function fetchJson(baseUrl: string, path: string, apiKey: string): Promise<unknown> {
    const url = new URL(path, baseUrl);
    const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
    const text = await res.text();
    assert(res.ok, `Request failed (${res.status}) for ${url.toString()}: ${text.slice(0, 300)}`);
    return JSON.parse(text) as unknown;
}

async function detectPrefix(baseUrl: string, apiKey: string): Promise<'api/v1' | 'v1'> {
    const candidates = ['api/v1', 'v1'] as const;
    const errors: string[] = [];

    for (const prefix of candidates) {
        try {
            await fetchJson(baseUrl, `${prefix}/assets/search?q=solana&limit=1`, apiKey);
            return prefix;
        } catch (err) {
            errors.push(`${prefix}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    throw new Error(`Failed to reach assets API via known prefixes:\n${errors.join('\n')}`);
}

function trustTierPriority(tier: unknown): number {
    const value = typeof tier === 'string' ? tier : '';
    if (value === 'tier1') return 3;
    if (value === 'tier2') return 2;
    if (value === 'experimental') return 1;
    return 0;
}

function toFiniteNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

type VariantRow = {
    mint: string;
    trustTier: string;
    market?: { liquidity?: number | null; volume24hUSD?: number | null } | null;
    rank?: number;
};

function pickBestVariant(candidates: VariantRow[]): VariantRow | null {
    if (candidates.length === 0) return null;

    const sorted = candidates.slice().sort((a, b) => {
        const liquidityDelta = toFiniteNumber(b.market?.liquidity) - toFiniteNumber(a.market?.liquidity);
        if (liquidityDelta !== 0) return liquidityDelta;

        const trustDelta = trustTierPriority(b.trustTier) - trustTierPriority(a.trustTier);
        if (trustDelta !== 0) return trustDelta;

        const volumeDelta = toFiniteNumber(b.market?.volume24hUSD) - toFiniteNumber(a.market?.volume24hUSD);
        if (volumeDelta !== 0) return volumeDelta;

        const rankA = toFiniteNumber(a.rank);
        const rankB = toFiniteNumber(b.rank);
        const rankDelta = rankA - rankB;
        if (rankDelta !== 0) return rankDelta;

        return a.mint.localeCompare(b.mint);
    });

    return sorted[0] ?? null;
}

function extractVariantRows(raw: unknown): VariantRow[] {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const obj = raw as Record<string, unknown>;
    if (!Array.isArray(obj.spot)) return [];

    return (obj.spot as unknown[]).flatMap(row => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
        const r = row as Record<string, unknown>;
        const mint = typeof r.mint === 'string' ? r.mint.trim() : '';
        const trustTier = typeof r.trustTier === 'string' ? r.trustTier : 'experimental';
        if (!mint) return [];

        const marketRaw = r.market;
        const market =
            marketRaw && typeof marketRaw === 'object' && !Array.isArray(marketRaw)
                ? {
                      liquidity: (marketRaw as any).liquidity ?? null,
                      volume24hUSD: (marketRaw as any).volume24hUSD ?? null,
                  }
                : null;

        const rank = typeof r.rank === 'number' && Number.isFinite(r.rank) ? r.rank : undefined;

        return [
            {
                mint,
                trustTier,
                market,
                ...(rank != null ? { rank } : {}),
            } satisfies VariantRow,
        ];
    });
}

async function main(): Promise<void> {
    const baseUrlRaw =
        process.env.API_BASE_URL?.trim() ??
        process.env.TOKENS_API_BASE_URL?.trim() ??
        process.env.TOKENS_API_ORIGIN?.trim() ??
        '';
    const apiKey = process.env.API_KEY?.trim() ?? process.env.TOKENS_API_KEY?.trim() ?? '';

    assert(baseUrlRaw.length > 0, 'Missing env: API_BASE_URL (example: http://localhost:3002)');
    assert(apiKey.length > 0, 'Missing env: API_KEY (or TOKENS_API_KEY)');

    const baseUrl = `${coerceBaseUrl(baseUrlRaw)}/`;
    const prefix = await detectPrefix(baseUrl, apiKey);

    const assetIds = (process.env.ASSET_IDS ?? 'bitcoin,usd,gold,apple')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    let checked = 0;
    let skipped = 0;

    for (const assetId of assetIds) {
        const data = await fetchJson(baseUrl, `${prefix}/assets/${encodeURIComponent(assetId)}`, apiKey);
        assert(data && typeof data === 'object' && !Array.isArray(data), 'asset response must be an object');

        const asset = (data as any).asset;
        assert(asset && typeof asset === 'object' && !Array.isArray(asset), 'asset response must include asset');

        const primaryMint = typeof asset.primaryVariant?.mint === 'string' ? asset.primaryVariant.mint : null;
        const candidates = extractVariantRows(asset.variantGroups);

        const best = pickBestVariant(candidates);
        if (!best || !primaryMint) {
            console.log(`[skip] ${assetId}: no primary variant or candidates`);
            skipped++;
            continue;
        }

        const bestLiquidity = toFiniteNumber(best.market?.liquidity);
        if (bestLiquidity <= 0) {
            console.log(`[skip] ${assetId}: no usable liquidity data`);
            skipped++;
            continue;
        }

        checked++;
        assert(
            primaryMint === best.mint,
            `primaryVariant mismatch for ${assetId}: expected ${best.mint} (liq=${bestLiquidity}), got ${primaryMint}`,
        );

        console.log(`[ok] ${assetId}: primary=${primaryMint} (liq=${bestLiquidity})`);
    }

    console.log(`Audit complete: checked=${checked}, skipped=${skipped}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
