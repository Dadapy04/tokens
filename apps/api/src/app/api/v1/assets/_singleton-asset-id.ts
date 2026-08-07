const SINGLETON_ASSET_ID_PREFIX = 'solana-' as const;

export function looksLikeSolanaMintAddress(value: string): boolean {
    // Base58 (no 0,O,I,l) and common Solana mint length range.
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export function mintToSingletonAssetId(mint: string): string {
    const trimmed = mint.trim();
    return `${SINGLETON_ASSET_ID_PREFIX}${trimmed}`;
}

export function singletonAssetIdToMint(assetId: string): string | null {
    const trimmed = assetId.trim();
    if (!trimmed.startsWith(SINGLETON_ASSET_ID_PREFIX)) return null;
    const mint = trimmed.slice(SINGLETON_ASSET_ID_PREFIX.length).trim();
    return looksLikeSolanaMintAddress(mint) ? mint : null;
}

export function isSingletonAssetId(assetId: string): boolean {
    return singletonAssetIdToMint(assetId) !== null;
}
