'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { getPythFeedMapping } from '@/lib/realtime-prices/pyth-feed-mapping';
import { resolveHermesCryptoUsdFeedId } from '@/lib/realtime-prices/pyth-feed-resolver';
import { subscribeHermesPriceStream, type HermesPriceTick } from '@/lib/realtime-prices/pyth-hermes-stream';
import { setLiveSpotPrice } from '@/lib/realtime-prices/live-spot-store';

const UI_THROTTLE_MS = 1_000;
const REALTIME_STALE_MS = 7_500;

export interface UseRealtimeQuoteArgs {
    /**
     * Stable key for the live store (prefer `coingeckoId` when available, else `assetId`).
     * This keeps live prices scoped and prevents unrelated rerenders.
     */
    quoteKey: string;
    coingeckoId?: string | null;
    symbol?: string;
    enabled?: boolean;
    /** If false, do not start the Hermes stream yet. */
    streamEnabled?: boolean;
    /** Optional warm-start (e.g. cached price/DB price) to seed the live store. */
    seedPriceUsd?: number | null;
}

export type RealtimeQuoteStatusKind = 'realtime' | 'last-known' | 'fallback' | 'disabled';

export interface RealtimeQuoteStatus {
    kind: RealtimeQuoteStatusKind;
    updatedAtMs: number | null;
    source: 'pyth' | 'seed' | 'none';
}

const INITIAL_STATUS: RealtimeQuoteStatus = { kind: 'fallback', updatedAtMs: null, source: 'seed' };
const DISABLED_STATUS: RealtimeQuoteStatus = { kind: 'disabled', updatedAtMs: null, source: 'none' };

function normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim();
}

function shouldAcceptSeed(priceUsd: number | null | undefined): priceUsd is number {
    return typeof priceUsd === 'number' && Number.isFinite(priceUsd) && priceUsd > 0;
}

export function useRealtimeQuote(args: UseRealtimeQuoteArgs): RealtimeQuoteStatus {
    const enabled = (args.enabled ?? true) && normalizeText(args.quoteKey).length > 0;
    const streamEnabled = enabled && (args.streamEnabled ?? true);

    const coingeckoId = normalizeText(args.coingeckoId ?? undefined);
    const mapping = useMemo(() => (coingeckoId ? getPythFeedMapping(coingeckoId) : null), [coingeckoId]);

    const symbolUpper = normalizeText(args.symbol ?? undefined).toUpperCase();
    const [resolvedFeed, setResolvedFeed] = useState<{ symbolUpper: string; feedId: string } | null>(null);

    const feedId = mapping?.hermesFeedId ?? (resolvedFeed?.symbolUpper === symbolUpper ? resolvedFeed.feedId : null);

    // `disabled` is derived from `enabled` at return time; state only tracks the live quote.
    const [status, setStatus] = useState<RealtimeQuoteStatus>(INITIAL_STATUS);

    const latestTickRef = useRef<HermesPriceTick | null>(null);
    const lastRealtimeTickAtRef = useRef<number | null>(null);
    const lastUiUpdateAtRef = useRef(0);

    // Reset live-status bookkeeping whenever the quote identity (or enablement) changes.
    useEffect(() => {
        latestTickRef.current = null;
        lastRealtimeTickAtRef.current = null;
        lastUiUpdateAtRef.current = 0;
        setStatus(INITIAL_STATUS);
    }, [enabled, args.quoteKey, coingeckoId, symbolUpper]);

    // Resolve feed id when no static mapping is available.
    useEffect(() => {
        if (!enabled || mapping || !symbolUpper) {
            setResolvedFeed(null);
            return;
        }
        if (resolvedFeed?.symbolUpper === symbolUpper) return;

        let cancelled = false;
        void (async () => {
            const next = await resolveHermesCryptoUsdFeedId(symbolUpper);
            if (cancelled) return;
            setResolvedFeed(next ? { symbolUpper, feedId: next } : null);
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled, mapping, symbolUpper, resolvedFeed?.symbolUpper]);

    // Warm-start the live store so UI can read a value before realtime connects.
    useEffect(() => {
        if (!enabled) return;
        if (!shouldAcceptSeed(args.seedPriceUsd)) return;

        const now = Date.now();
        setLiveSpotPrice(args.quoteKey, { priceUsd: args.seedPriceUsd, updatedAtMs: now, source: 'seed' });
        setStatus(prev => (prev.kind === 'realtime' ? prev : { kind: 'last-known', updatedAtMs: now, source: 'seed' }));
    }, [enabled, args.quoteKey, args.seedPriceUsd]);

    // Stream realtime ticks into the live store (throttled).
    useEffect(() => {
        if (!streamEnabled) return;
        if (!feedId) return;

        const unsubscribe = subscribeHermesPriceStream({
            feedIds: [feedId],
            seedLatest: true,
            onError: () => {
                setStatus(prev =>
                    prev.kind === 'fallback'
                        ? prev
                        : { kind: 'fallback', updatedAtMs: prev.updatedAtMs, source: prev.source },
                );
            },
            onTick: tick => {
                latestTickRef.current = tick;
                lastRealtimeTickAtRef.current = Date.now();

                const now = Date.now();
                if (now - lastUiUpdateAtRef.current < UI_THROTTLE_MS) return;
                lastUiUpdateAtRef.current = now;

                const updatedAtMs = tick.publishTimeMs ?? now;
                setLiveSpotPrice(args.quoteKey, { priceUsd: tick.priceUsd, updatedAtMs, source: 'pyth' });
                setStatus(prev =>
                    prev.kind === 'realtime' ? prev : { kind: 'realtime', updatedAtMs, source: 'pyth' },
                );
            },
        });

        return () => unsubscribe();
    }, [streamEnabled, feedId, args.quoteKey]);

    // Degrade realtime status if ticks go stale.
    useEffect(() => {
        if (!streamEnabled) return;
        if (!feedId) return;

        const intervalId = window.setInterval(() => {
            const lastAt = lastRealtimeTickAtRef.current;
            if (lastAt == null) return;
            if (Date.now() - lastAt <= REALTIME_STALE_MS) return;

            setStatus(prev => {
                if (prev.kind !== 'realtime') return prev;
                return { kind: 'fallback', updatedAtMs: prev.updatedAtMs, source: prev.source };
            });
        }, 1_000);

        return () => window.clearInterval(intervalId);
    }, [streamEnabled, feedId]);

    return enabled ? status : DISABLED_STATUS;
}
