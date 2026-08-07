export const SUI_ASSET_ID = 'sui';
export const SUI_CANONICAL_MINT = 'suifhC9gU1VbJAPYPTBkHJyyyStKGLLYPVDTmPoqbvA';
export const SUI_LEGACY_MINT = 'XspncLEk5B19BMLwvC26DqNtJxKWWxuBKq9phbCG8ff';
export const SUI_CANONICAL_SYMBOL = 'SUI';
export const SUI_CANONICAL_NAME = 'SUI';

interface AssetLike<TVariant> {
    assetId: string;
    name?: string;
    symbol?: string;
    variants: TVariant[];
}

interface VariantLike {
    mint: string;
    symbol?: string;
    name?: string;
    label?: string;
}

export function canonicalizeAsset<TVariant extends VariantLike, TAsset extends AssetLike<TVariant>>(
    asset: TAsset,
): TAsset {
    if (asset.assetId !== SUI_ASSET_ID) return asset;
    return {
        ...asset,
        name: SUI_CANONICAL_NAME,
        symbol: SUI_CANONICAL_SYMBOL,
        variants: canonicalizeAssetVariants(asset.assetId, asset.variants),
    };
}

export function canonicalizeAssetVariants<T extends VariantLike>(assetId: string, variants: T[]): T[] {
    if (assetId !== SUI_ASSET_ID) return variants;

    const filtered = variants.filter(v => v.mint !== SUI_LEGACY_MINT);
    return filtered.map(v => {
        if (v.mint !== SUI_CANONICAL_MINT) return v;
        return {
            ...v,
            // Force canonical identity even if DB/markets say otherwise.
            symbol: SUI_CANONICAL_SYMBOL,
            name: SUI_CANONICAL_NAME,
        };
    });
}
