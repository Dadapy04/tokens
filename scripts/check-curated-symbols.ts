// @ts-expect-error plain-JS helper without type declarations
import { loadLocalEnv } from './_env.mjs';
// @ts-expect-error plain-JS helper without type declarations
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

import { getVariantByMint } from '@tokens/asset-registry';
import {
    CURATED_LIST_ORDER,
    getCuratedTokenAddresses,
    getCuratedTokenList,
    isCuratedTokenListId,
    type CuratedTokenListId,
} from '@tokens/asset-registry/compat';

function getArg(name: string, fallback: string | null): string | null {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]!;
    return fallback;
}

function getFlag(name: string): boolean {
    return process.argv.includes(`--${name}`);
}

function toInt(value: string | null, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

function uniqueStrings(values: readonly string[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
        const trimmed = value.trim();
        if (!trimmed) continue;
        if (seen.has(trimmed)) continue;
        seen.add(trimmed);
        out.push(trimmed);
    }
    return out;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

function looksLikeSolanaMintAddress(value: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function normalizeSymbol(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed === '???' || trimmed === '—') return null;
    if (looksLikeSolanaMintAddress(trimmed)) return null;
    return trimmed;
}

type MintStatus = {
    mint: string;
    listIds: CuratedTokenListId[];

    registryAssetId: string | null;
    registryKnown: boolean;
    registryAssetSymbol: string | null;
    registryVariantSymbol: string | null;

    dbAssetSymbol: string | null;
    dbMarketSymbol: string | null;

    dbHasAssetRow: boolean;
    dbHasMarketRow: boolean;
    dbMarketSource: string | null;
};

function resolveSelectedListIds(listArg: string): CuratedTokenListId[] {
    const list = listArg.trim().toLowerCase();
    if (list === 'all') return [...CURATED_LIST_ORDER];
    if (!isCuratedTokenListId(list)) {
        throw new Error(`Invalid --list "${listArg}". Expected one of: all, ${CURATED_LIST_ORDER.join(', ')}`);
    }
    return [list];
}

async function main(): Promise<void> {
    const listArg = getArg('list', 'all') ?? 'all';
    const show = Math.max(toInt(getArg('show', '50'), 50), 0);
    const onlyMissing = getFlag('only-missing');

    await loadLocalEnv();

    if (!cloudRunEnabled('assets')) {
        throw new Error(
            'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
        );
    }

    const selectedListIds = resolveSelectedListIds(listArg);

    const mintsByListId = new Map<CuratedTokenListId, string[]>();
    for (const listId of selectedListIds) {
        const list = getCuratedTokenList(listId);
        mintsByListId.set(listId, uniqueStrings(getCuratedTokenAddresses(list)));
    }

    const allMints = uniqueStrings(Array.from(mintsByListId.values()).flat());
    if (allMints.length === 0) {
        console.log('No curated mints found.');
        return;
    }

    const listIdsByMint = new Map<string, CuratedTokenListId[]>();
    for (const [listId, mints] of mintsByListId) {
        for (const mint of mints) {
            const prev = listIdsByMint.get(mint) ?? [];
            if (!prev.includes(listId)) listIdsByMint.set(mint, [...prev, listId]);
        }
    }

    const registryByMint = new Map<
        string,
        {
            assetId: string | null;
            known: boolean;
            assetSymbol: string | null;
            variantSymbol: string | null;
        }
    >();
    const uniqueAssetIds: string[] = [];
    const seenAssetIds = new Set<string>();
    for (const mint of allMints) {
        const match = getVariantByMint(mint);
        const assetId = match?.asset.assetId?.trim() || null;
        const known = Boolean(match && assetId);
        const assetSymbol = normalizeSymbol(match?.asset.symbol);
        const variantSymbol = normalizeSymbol(match?.variant.symbol);

        registryByMint.set(mint, { assetId, known, assetSymbol, variantSymbol });

        const effectiveAssetId = assetId ?? mint;
        if (!seenAssetIds.has(effectiveAssetId)) {
            seenAssetIds.add(effectiveAssetId);
            uniqueAssetIds.push(effectiveAssetId);
        }
    }

    const dbMarketByMint = new Map<string, { symbol: string | null; source: string | null; hasRow: boolean }>();
    for (const batch of chunk(allMints, 250)) {
        const rows = await callCloudRun('assets', 'query', 'variantMarketsGetLatestByMints', { mints: batch });
        for (const row of rows) {
            const market = row.market;
            dbMarketByMint.set(row.mint, {
                symbol: normalizeSymbol(market?.symbol),
                source: typeof market?.source === 'string' ? market.source : null,
                hasRow: market !== null,
            });
        }
    }

    const dbAssetSymbolByAssetId = new Map<string, { symbol: string | null; hasRow: boolean }>();
    for (const batch of chunk(uniqueAssetIds, 500)) {
        const rows = await callCloudRun('assets', 'query', 'getByAssetIds', { assetIds: batch });
        for (const row of rows) {
            dbAssetSymbolByAssetId.set(row.assetId, {
                symbol: normalizeSymbol(row.asset?.symbol),
                hasRow: row.asset !== null,
            });
        }
    }

    const statuses: MintStatus[] = allMints.map(mint => {
        const listIds = listIdsByMint.get(mint) ?? [];
        const reg = registryByMint.get(mint) ?? {
            assetId: null,
            known: false,
            assetSymbol: null,
            variantSymbol: null,
        };
        const assetId = reg.assetId ?? mint;
        const dbAsset = dbAssetSymbolByAssetId.get(assetId) ?? { symbol: null, hasRow: false };
        const dbMarket = dbMarketByMint.get(mint) ?? { symbol: null, source: null, hasRow: false };

        return {
            mint,
            listIds,
            registryAssetId: reg.assetId,
            registryKnown: reg.known,
            registryAssetSymbol: reg.assetSymbol,
            registryVariantSymbol: reg.variantSymbol,
            dbAssetSymbol: dbAsset.symbol,
            dbMarketSymbol: dbMarket.symbol,
            dbHasAssetRow: dbAsset.hasRow,
            dbHasMarketRow: dbMarket.hasRow,
            dbMarketSource: dbMarket.source,
        };
    });

    const missingMarketSymbol = statuses.filter(s => s.dbMarketSymbol === null);
    const missingAssetSymbol = statuses.filter(s => s.dbAssetSymbol === null);
    const missingBoth = statuses.filter(s => s.dbMarketSymbol === null && s.dbAssetSymbol === null);
    const missingMarketRow = statuses.filter(s => !s.dbHasMarketRow);
    const missingAssetRow = statuses.filter(s => !s.dbHasAssetRow);
    const registryUnknown = statuses.filter(s => !s.registryKnown);

    console.log(
        [
            'Curated symbol coverage',
            `list=${selectedListIds.join(',')}`,
            `mints=${formatNumber(statuses.length)}`,
            `missingMarketSymbol=${formatNumber(missingMarketSymbol.length)}`,
            `missingAssetSymbol=${formatNumber(missingAssetSymbol.length)}`,
            `missingBoth=${formatNumber(missingBoth.length)}`,
            `missingMarketRow=${formatNumber(missingMarketRow.length)}`,
            `missingAssetRow=${formatNumber(missingAssetRow.length)}`,
            `registryUnknown=${formatNumber(registryUnknown.length)}`,
        ].join(' | '),
    );

    function printSection(title: string, rows: MintStatus[]) {
        if (rows.length === 0) return;
        console.log(`\n${title} (${formatNumber(rows.length)})`);
        for (const s of rows.slice(0, show)) {
            const assetId = s.registryAssetId ?? s.mint;
            const lists = s.listIds.length > 0 ? s.listIds.join(',') : '—';
            console.log(
                [
                    `- mint=${s.mint}`,
                    `lists=${lists}`,
                    `assetId=${assetId}`,
                    `dbMarketSymbol=${s.dbMarketSymbol ?? '∅'}`,
                    `dbAssetSymbol=${s.dbAssetSymbol ?? '∅'}`,
                    `source=${s.dbMarketSource ?? '∅'}`,
                    s.registryKnown ? '' : 'registry=unknown',
                ]
                    .filter(Boolean)
                    .join(' | '),
            );
        }
        if (rows.length > show) console.log(`…and ${formatNumber(rows.length - show)} more`);
    }

    if (!onlyMissing) {
        const sample = statuses.slice(0, Math.min(10, statuses.length));
        console.log('\nSample:');
        for (const s of sample) {
            console.log(
                [
                    `- mint=${s.mint}`,
                    `dbMarketSymbol=${s.dbMarketSymbol ?? '∅'}`,
                    `dbAssetSymbol=${s.dbAssetSymbol ?? '∅'}`,
                    `source=${s.dbMarketSource ?? '∅'}`,
                ].join(' | '),
            );
        }
    }

    printSection('Missing BOTH market + asset symbol', missingBoth);
    printSection('Missing market symbol (variantMarketsLatest)', missingMarketSymbol);
    printSection('Missing asset symbol (assets)', missingAssetSymbol);
}

await main();
