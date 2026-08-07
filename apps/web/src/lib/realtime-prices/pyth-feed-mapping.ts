export interface PythFeedMapping {
    hermesFeedId: string;
    source: 'pyth' | 'manual';
}

// Optional static mapping for high-signal assets.
// Start empty and rely on dynamic Hermes resolution by symbol.
const PYTH_FEED_BY_COINGECKO_ID: Record<string, PythFeedMapping> = {};

export function getPythFeedMapping(coingeckoId: string): PythFeedMapping | null {
    const id = (coingeckoId ?? '').trim();
    if (!id) return null;
    return PYTH_FEED_BY_COINGECKO_ID[id] ?? null;
}
