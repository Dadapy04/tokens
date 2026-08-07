'use client';

import {
    HERMES_PUBLIC_ENDPOINT,
    type HermesPriceFeedMetadata,
    normalizeHermesSymbol,
    pickExactCryptoUsdFeedId,
} from '@/lib/realtime-prices/pyth-feed-selection';

// Bump this if we change selection heuristics, so old cached IDs don't poison resolution.
const LOCAL_CACHE_PREFIX = 'TOKENS_HERMES_FEED_ID_V2:';

function buildCacheKey(symbolUpper: string): string {
    return `${LOCAL_CACHE_PREFIX}${symbolUpper}`;
}

function readCachedFeedId(symbolUpper: string): string | null {
    try {
        const raw = window.localStorage.getItem(buildCacheKey(symbolUpper));
        const id = (raw ?? '').trim();
        return id ? id : null;
    } catch {
        return null;
    }
}

function writeCachedFeedId(symbolUpper: string, feedId: string): void {
    try {
        window.localStorage.setItem(buildCacheKey(symbolUpper), feedId);
    } catch {
        // Ignore storage failures (private mode, quota, etc.).
    }
}

const inFlightBySymbol = new Map<string, Promise<string | null>>();

export async function resolveHermesCryptoUsdFeedId(symbolInput: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const symbolUpper = normalizeHermesSymbol(symbolInput);
    if (!symbolUpper) return null;

    const cached = readCachedFeedId(symbolUpper);
    if (cached) return cached;

    const existing = inFlightBySymbol.get(symbolUpper);
    if (existing) return existing;

    const promise = (async () => {
        try {
            const params = new URLSearchParams({ query: symbolUpper, asset_type: 'crypto' });
            const res = await fetch(`${HERMES_PUBLIC_ENDPOINT}/v2/price_feeds?${params.toString()}`, { method: 'GET' });
            if (!res.ok) return null;
            const json = (await res.json()) as unknown;
            if (!Array.isArray(json)) return null;

            const feeds = json as HermesPriceFeedMetadata[];
            const resolved = pickExactCryptoUsdFeedId(symbolUpper, feeds);
            if (resolved) writeCachedFeedId(symbolUpper, resolved);
            return resolved;
        } catch {
            return null;
        } finally {
            inFlightBySymbol.delete(symbolUpper);
        }
    })();

    inFlightBySymbol.set(symbolUpper, promise);
    return promise;
}
