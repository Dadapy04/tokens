import { getTokenLogoURLForMintWithSecondarySymbol } from '@/lib/logo-overrides';

export interface VariantHolding {
    id: string;
    name: string;
    symbol: string;
    logoUrl: string;
    balanceLabel: string;
    accountLabel: string;
}

export interface WalletAsset {
    nameLabel: string;
    symbolLabel: string;
    imageUrl: string;
    balanceLabel: string;
    accountLabel: string;
    compositionSegments: ReadonlyArray<{ weight: number; color: string }>;
    variantHoldings: ReadonlyArray<VariantHolding>;
}

export function walletAssetFromData(data: unknown): WalletAsset {
    const asset = recordAt(data, 'asset') ?? asRecord(data);
    const primaryVariant = recordAt(asset, 'primaryVariant');
    const primaryMarket = recordAt(primaryVariant, 'market');
    const name = textAt(asset, 'name') || 'US Dollar';
    const symbol = textAt(asset, 'symbol') || 'USD';
    const imageUrl = textAt(asset, 'imageUrl') || textAt(primaryMarket, 'logoURI') || '';
    const balanceValue = 12493.17;
    const variants = collectVariantInfos(asset, primaryVariant).slice(0, 4);
    const variantHoldings = buildVariantHoldings(variants, balanceValue);

    return {
        nameLabel: name,
        symbolLabel: symbol,
        imageUrl,
        balanceLabel: formatUsd(balanceValue),
        accountLabel: 'Account •••• 3812',
        compositionSegments: variantHoldings.map((variant) => ({
            weight: variant.weight,
            color: colorFromTokenImage(variant.logoUrl),
        })),
        variantHoldings: variantHoldings.map((variant) => ({
            id: variant.id,
            name: variant.name,
            symbol: variant.symbol,
            logoUrl: variant.logoUrl,
            balanceLabel: formatUsd(variant.value),
            accountLabel: variant.accountLabel,
        })),
    };
}

export function colorFromTokenImage(imageUrl: string): string {
    const palette = [
        'rgba(64, 164, 255, 0.88)',
        'rgba(136, 112, 255, 0.88)',
        'rgba(255, 183, 77, 0.88)',
        'rgba(80, 220, 170, 0.88)',
        'rgba(255, 126, 148, 0.88)',
        'rgba(170, 220, 80, 0.88)',
    ];
    let hash = 0;
    for (let i = 0; i < imageUrl.length; i += 1) {
        hash = (hash * 31 + imageUrl.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
}

function collectVariantInfos(
    asset: Record<string, unknown> | null,
    primaryVariant: Record<string, unknown> | null,
): Array<{ id: string; name: string; symbol: string; logoUrl: string }> {
    const out: Array<{ id: string; name: string; symbol: string; logoUrl: string }> = [];
    const primaryMarket = recordAt(primaryVariant, 'market');
    const primaryLogo = textAt(primaryMarket, 'logoURI');

    if (primaryLogo) {
        const primarySymbol = textAt(primaryVariant, 'symbol') || 'USDC';
        const primaryName = textAt(primaryVariant, 'name') || 'USD Coin';
        const primaryMint = textAt(primaryVariant, 'mint');
        out.push({
            id: textAt(primaryVariant, 'variantId') || 'primary',
            name: primaryName,
            symbol: primarySymbol,
            logoUrl: getTokenLogoURLForMintWithSecondarySymbol(primaryMint, primarySymbol, primaryName, primaryLogo) ?? primaryLogo,
        });
    }

    const groups = recordAt(asset, 'variantGroups');
    if (!groups) return dedupeVariants(out);

    for (const key of Object.keys(groups)) {
        const maybeList = (groups as Record<string, unknown>)[key];
        if (!Array.isArray(maybeList)) continue;
        for (const entry of maybeList) {
            const entryRecord = asRecord(entry);
            const market = recordAt(entryRecord, 'market');
            const rawLogoUrl = textAt(market, 'logoURI');
            const symbol = textAt(entryRecord, 'symbol') || 'USD';
            const name = textAt(entryRecord, 'name') || 'USD variant';
            const mint = textAt(entryRecord, 'mint');
            const logoUrl = getTokenLogoURLForMintWithSecondarySymbol(mint, symbol, name, rawLogoUrl) ?? rawLogoUrl;
            if (!logoUrl) continue;
            out.push({
                id: textAt(entryRecord, 'variantId') || `${key}:${out.length}`,
                name,
                symbol,
                logoUrl,
            });
            if (out.length >= 12) break;
        }
        if (out.length >= 12) break;
    }

    return dedupeVariants(out);
}

function dedupeVariants(items: Array<{ id: string; name: string; symbol: string; logoUrl: string }>) {
    const seen = new Set<string>();
    const out: Array<{ id: string; name: string; symbol: string; logoUrl: string }> = [];
    for (const item of items) {
        const key = `${item.id}|${item.logoUrl}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

function buildVariantHoldings(
    variants: Array<{ id: string; name: string; symbol: string; logoUrl: string }>,
    total: number,
): Array<{ id: string; name: string; symbol: string; logoUrl: string; weight: number; value: number; accountLabel: string }> {
    const weights = [0.58, 0.24, 0.12, 0.06];
    const rows = variants.slice(0, weights.length).map((variant, index) => {
        const weight = weights[index] ?? 0;
        return {
            id: variant.id,
            name: variant.name,
            symbol: variant.symbol,
            logoUrl: variant.logoUrl,
            weight,
            value: total * weight,
            accountLabel: `Subaccount •••• ${String(1120 + index * 7).slice(-4)}`,
        };
    });
    const sum = rows.reduce((acc, row) => acc + row.value, 0);
    if (rows.length > 0) rows[0] = { ...rows[0], value: rows[0].value + (total - sum) };
    return rows;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function recordAt(value: unknown, key: string): Record<string, unknown> | null {
    const record = asRecord(value);
    return asRecord(record?.[key]);
}

function textAt(value: unknown, key: string): string {
    const record = asRecord(value);
    const text = record?.[key];
    return typeof text === 'string' ? text : '';
}

function formatUsd(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
