import 'server-only';

import { getPythFeedMapping } from '@/lib/realtime-prices/pyth-feed-mapping';
import {
    HERMES_PUBLIC_ENDPOINT,
    type HermesPriceFeedMetadata,
    normalizeHermesSymbol,
    pickExactCryptoUsdFeedId,
} from '@/lib/realtime-prices/pyth-feed-selection';

interface HermesRpcPrice {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
}

interface HermesParsedPriceUpdate {
    id: string;
    price: HermesRpcPrice;
}

interface HermesPriceUpdateEnvelope {
    parsed?: HermesParsedPriceUpdate[] | null;
}

export interface HermesLatestPrice {
    feedId: string;
    priceUsd: number;
    confidenceUsd: number | null;
    publishTimeMs: number | null;
}

const FEED_ID_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FEED_ID_MISS_TTL_MS = 5 * 60 * 1000;
const feedIdCache = new Map<string, { feedId: string | null; expiresAtMs: number }>();
const inFlightFeedIdBySymbol = new Map<string, Promise<string | null>>();

function normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim();
}

function parseHermesPriceToNumber(price: HermesRpcPrice): { priceUsd: number; confidenceUsd: number } | null {
    const rawPrice = Number(price.price);
    const rawConf = Number(price.conf);
    if (!Number.isFinite(rawPrice) || !Number.isFinite(rawConf) || !Number.isFinite(price.expo)) return null;

    const scale = Math.pow(10, price.expo);
    const priceUsd = rawPrice * scale;
    const confidenceUsd = rawConf * scale;
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    return { priceUsd, confidenceUsd };
}

function buildLatestUrl(feedId: string): string {
    const params = new URLSearchParams();
    params.append('ids[]', feedId);
    params.set('parsed', 'true');
    return `${HERMES_PUBLIC_ENDPOINT}/v2/updates/price/latest?${params.toString()}`;
}

async function resolveHermesCryptoUsdFeedIdServer(args: {
    coingeckoId?: string | null;
    symbol?: string | null;
}): Promise<string | null> {
    const coingeckoId = normalizeText(args.coingeckoId);
    const mapped = coingeckoId ? getPythFeedMapping(coingeckoId) : null;
    if (mapped?.hermesFeedId) return mapped.hermesFeedId;

    const symbolUpper = normalizeHermesSymbol(args.symbol ?? '');
    if (!symbolUpper) return null;

    const now = Date.now();
    const cached = feedIdCache.get(symbolUpper);
    if (cached && cached.expiresAtMs > now) return cached.feedId;

    const existing = inFlightFeedIdBySymbol.get(symbolUpper);
    if (existing) return existing;

    const promise = (async () => {
        try {
            const params = new URLSearchParams({ query: symbolUpper, asset_type: 'crypto' });
            const res = await fetch(`${HERMES_PUBLIC_ENDPOINT}/v2/price_feeds?${params.toString()}`, {
                method: 'GET',
                cache: 'no-store',
            });
            if (!res.ok) {
                feedIdCache.set(symbolUpper, { feedId: null, expiresAtMs: Date.now() + FEED_ID_MISS_TTL_MS });
                return null;
            }

            const json = (await res.json()) as unknown;
            if (!Array.isArray(json)) {
                feedIdCache.set(symbolUpper, { feedId: null, expiresAtMs: Date.now() + FEED_ID_MISS_TTL_MS });
                return null;
            }

            const feedId = pickExactCryptoUsdFeedId(symbolUpper, json as HermesPriceFeedMetadata[]);
            feedIdCache.set(symbolUpper, {
                feedId,
                expiresAtMs: Date.now() + (feedId ? FEED_ID_CACHE_TTL_MS : FEED_ID_MISS_TTL_MS),
            });
            return feedId;
        } catch {
            feedIdCache.set(symbolUpper, { feedId: null, expiresAtMs: Date.now() + FEED_ID_MISS_TTL_MS });
            return null;
        } finally {
            inFlightFeedIdBySymbol.delete(symbolUpper);
        }
    })();

    inFlightFeedIdBySymbol.set(symbolUpper, promise);
    return promise;
}

export async function fetchHermesLatestPrice(args: {
    coingeckoId?: string | null;
    symbol?: string | null;
}): Promise<HermesLatestPrice | null> {
    const feedId = await resolveHermesCryptoUsdFeedIdServer(args);
    if (!feedId) return null;

    try {
        const res = await fetch(buildLatestUrl(feedId), { method: 'GET', cache: 'no-store' });
        if (!res.ok) return null;

        const json = (await res.json()) as unknown;
        const parsed = (json as HermesPriceUpdateEnvelope | null)?.parsed ?? null;
        if (!Array.isArray(parsed) || parsed.length === 0) return null;

        const update = parsed.find(entry => normalizeText(entry?.id) === feedId) ?? parsed[0];
        if (!update) return null;

        const converted = parseHermesPriceToNumber(update.price);
        if (!converted) return null;

        return {
            feedId,
            priceUsd: converted.priceUsd,
            confidenceUsd: Number.isFinite(converted.confidenceUsd) ? converted.confidenceUsd : null,
            publishTimeMs:
                typeof update.price.publish_time === 'number' && Number.isFinite(update.price.publish_time)
                    ? update.price.publish_time * 1000
                    : null,
        };
    } catch {
        return null;
    }
}
