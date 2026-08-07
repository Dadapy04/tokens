'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type LiveSpotSource = 'pyth' | 'seed' | 'last-known';

export interface LiveSpotPrice {
    priceUsd: number;
    updatedAtMs: number;
    source: LiveSpotSource;
}

const liveByKey = new Map<string, LiveSpotPrice>();
const listenersByKey = new Map<string, Set<() => void>>();

function normalizeKey(key: string): string {
    return (key ?? '').trim();
}

function emit(key: string): void {
    const k = normalizeKey(key);
    if (!k) return;
    const listeners = listenersByKey.get(k);
    if (!listeners) return;
    for (const listener of Array.from(listeners)) listener();
}

export function getLiveSpotPrice(key: string): LiveSpotPrice | null {
    const k = normalizeKey(key);
    if (!k) return null;
    return liveByKey.get(k) ?? null;
}

export function setLiveSpotPrice(key: string, next: LiveSpotPrice): void {
    const k = normalizeKey(key);
    if (!k) return;

    if (!Number.isFinite(next.priceUsd) || next.priceUsd <= 0) return;
    if (!Number.isFinite(next.updatedAtMs) || next.updatedAtMs <= 0) return;

    const prev = liveByKey.get(k) ?? null;
    if (prev && prev.priceUsd === next.priceUsd && prev.updatedAtMs === next.updatedAtMs && prev.source === next.source)
        return;

    liveByKey.set(k, next);
    emit(k);
}

function subscribeKey(key: string, onStoreChange: () => void): () => void {
    const k = normalizeKey(key);
    if (!k) return () => {};

    const set = listenersByKey.get(k) ?? new Set<() => void>();
    set.add(onStoreChange);
    listenersByKey.set(k, set);

    return () => {
        const current = listenersByKey.get(k);
        if (!current) return;
        current.delete(onStoreChange);
        if (current.size === 0) listenersByKey.delete(k);
    };
}

export function useLiveSpotPrice(key: string): LiveSpotPrice | null {
    const k = normalizeKey(key);
    const subscribe = useCallback((onStoreChange: () => void) => subscribeKey(k, onStoreChange), [k]);

    return useSyncExternalStore(
        subscribe,
        () => getLiveSpotPrice(k),
        () => null,
    );
}
