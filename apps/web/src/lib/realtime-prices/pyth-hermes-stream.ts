'use client';

const HERMES_PUBLIC_ENDPOINT = 'https://hermes.pyth.network';

export interface HermesPriceTick {
    feedId: string;
    priceUsd: number;
    confidenceUsd: number | null;
    publishTimeMs: number | null;
}

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

function buildStreamUrl(feedIds: string[]): string {
    const params = new URLSearchParams();
    for (const id of feedIds) params.append('ids[]', id);
    params.set('parsed', 'true');
    return `${HERMES_PUBLIC_ENDPOINT}/v2/updates/price/stream?${params.toString()}`;
}

function buildLatestUrl(feedIds: string[]): string {
    const params = new URLSearchParams();
    for (const id of feedIds) params.append('ids[]', id);
    params.set('parsed', 'true');
    return `${HERMES_PUBLIC_ENDPOINT}/v2/updates/price/latest?${params.toString()}`;
}

export interface SubscribeHermesPriceStreamArgs {
    feedIds: string[];
    onTick: (tick: HermesPriceTick) => void;
    onError?: (error: unknown) => void;
    /**
     * If true, fetch `/latest` once before opening the stream.
     * Useful for fast first paint when no other warm start exists.
     */
    seedLatest?: boolean;
}

export function subscribeHermesPriceStream(args: SubscribeHermesPriceStreamArgs): () => void {
    const feedIds = args.feedIds.flatMap(raw => {
        const id = raw.trim();
        return id ? [id] : [];
    });
    if (feedIds.length === 0) return () => {};

    let isClosed = false;
    let eventSource: EventSource | null = null;

    function handleEnvelope(envelope: HermesPriceUpdateEnvelope): void {
        const parsed = envelope.parsed ?? null;
        if (!Array.isArray(parsed) || parsed.length === 0) return;

        for (const update of parsed) {
            if (!update) continue;
            const feedId = String(update.id ?? '').trim();
            if (!feedId) continue;

            const price = update.price;
            const converted = parseHermesPriceToNumber(price);
            if (!converted) continue;

            const publishTime = price.publish_time;
            args.onTick({
                feedId,
                priceUsd: converted.priceUsd,
                confidenceUsd: Number.isFinite(converted.confidenceUsd) ? converted.confidenceUsd : null,
                publishTimeMs:
                    typeof publishTime === 'number' && Number.isFinite(publishTime) ? publishTime * 1000 : null,
            });
        }
    }

    async function seedLatest(): Promise<void> {
        try {
            const res = await fetch(buildLatestUrl(feedIds), { method: 'GET' });
            if (!res.ok) throw new Error(`Hermes latest failed: ${res.status}`);
            const json = (await res.json()) as unknown;
            if (isClosed) return;
            handleEnvelope(json as HermesPriceUpdateEnvelope);
        } catch (error) {
            args.onError?.(error);
        }
    }

    if (args.seedLatest) void seedLatest();

    try {
        eventSource = new EventSource(buildStreamUrl(feedIds));

        eventSource.onmessage = event => {
            if (isClosed) return;
            try {
                const json = JSON.parse(event.data) as unknown;
                handleEnvelope(json as HermesPriceUpdateEnvelope);
            } catch (error) {
                args.onError?.(error);
            }
        };

        eventSource.onerror = error => {
            if (isClosed) return;
            args.onError?.(error);
            // EventSource will typically retry automatically; we keep it open.
        };
    } catch (error) {
        args.onError?.(error);
    }

    return () => {
        isClosed = true;
        eventSource?.close();
        eventSource = null;
    };
}
