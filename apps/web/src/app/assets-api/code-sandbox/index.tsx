'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
    DELETE_MS_PER_CHAR,
    FETCH_BEAT_MS,
    HOLD_MS,
    IDLE_MS,
    IDLE_TIMEOUT_MS,
    TYPE_MS_PER_CHAR,
    USER_FETCH_DEBOUNCE_MS,
    VISIBLE_RESULTS,
    VISIBLE_RESULTS_MOBILE,
} from './constants';
import { LeftPanel } from './left-panel';
import { RightPanel } from './right-panel';
import { TopBar } from './top-bar';
import type {
    AssetLookupResponse,
    AssetVariantResult,
    AssetVariantsResponse,
    AssetVariantsSnapshot,
    Mode,
    Phase,
    UserResult,
    VariantCardResult,
} from './types';
import './code-sandbox.css';

export type {
    AssetLookupResponse,
    AssetVariantResult,
    AssetVariantsResponse,
    AssetVariantsSnapshot,
} from './types';

interface CodeSandboxProps {
    items: AssetVariantsSnapshot[];
    limit: number;
}

function toRequestPath(assetId: string): string {
    return `/api/v1/assets/${encodeURIComponent(assetId)}/variants`;
}

function toSearchPath(query: string, limit: number): string {
    return `/api/v1/assets/search?q=${encodeURIComponent(query)}&limit=${limit}`;
}

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

function subscribeToDesktopChange(onStoreChange: () => void): () => void {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    mediaQuery.addEventListener('change', onStoreChange);
    return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getIsDesktop(): boolean {
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getServerIsDesktop(): boolean {
    return false;
}

async function fetchUserResult(
    query: string,
    limit: number,
    signal: AbortSignal,
): Promise<UserResult> {
    const searchPath = toSearchPath(query, limit);
    const emptyResult = (status: number): UserResult => ({
        assetId: '',
        requestPath: searchPath,
        data: { assetId: '', variants: [] },
        status,
    });

    try {
        const searchRes = await fetch(searchPath, {
            signal,
            headers: { accept: 'application/json' },
        });
        if (!searchRes.ok) return emptyResult(searchRes.status);
        const searchData = (await searchRes.json()) as AssetLookupResponse;
        const assetId = searchData.results?.[0]?.assetId?.trim() ?? '';
        if (!assetId) return emptyResult(searchRes.status);

        const requestPath = toRequestPath(assetId);
        const variantsRes = await fetch(requestPath, {
            signal,
            headers: { accept: 'application/json' },
        });
        if (!variantsRes.ok) {
            return {
                assetId,
                requestPath,
                data: { assetId, variants: [] },
                status: variantsRes.status,
            };
        }
        const variantsData = (await variantsRes.json()) as AssetVariantsResponse;
        return {
            assetId,
            requestPath,
            data: {
                assetId: variantsData.assetId ?? assetId,
                variants: Array.isArray(variantsData.variants) ? variantsData.variants : [],
            },
            status: variantsRes.status,
        };
    } catch (error) {
        if ((error as Error).name === 'AbortError') throw error;
        return emptyResult(503);
    }
}

function normalizeLabel(value?: string): string {
    return (value ?? '').trim();
}

function shortMint(mint: string): string {
    const trimmed = mint.trim();
    if (trimmed.length <= 12) return trimmed;
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function variantToCardResult(variant: AssetVariantResult): VariantCardResult {
    const symbol = normalizeLabel(variant.symbol) || normalizeLabel(variant.kind) || shortMint(variant.mint);
    const name =
        normalizeLabel(variant.name) ||
        normalizeLabel(variant.label) ||
        `${symbol} variant`;

    return {
        mint: variant.mint,
        name,
        symbol,
        ...(variant.kind ? { kind: variant.kind } : {}),
        stats: {
            price: variant.market?.price ?? null,
            priceChange24hPercent: variant.market?.priceChange24hPercent ?? null,
        },
        market: variant.market
            ? {
                  logoURI: variant.market.logoURI ?? null,
                  liquidity: variant.market.liquidity ?? null,
              }
            : null,
    };
}

export function CodeSandbox({ items, limit }: CodeSandboxProps) {
    const safeItems = items.length > 0 ? items : [];
    const firstQuery = safeItems[0]?.query ?? '';

    const [mode, setMode] = useState<Mode>('auto');
    const [autoIndex, setAutoIndex] = useState(0);
    const [autoTyped, setAutoTyped] = useState(firstQuery);
    const [autoPhase, setAutoPhase] = useState<Phase>('settled');
    const [userQuery, setUserQuery] = useState('');
    const [debouncedUserQuery, setDebouncedUserQuery] = useState('');
    const [inView, setInView] = useState(false);
    const isDesktop = useSyncExternalStore(
        subscribeToDesktopChange,
        getIsDesktop,
        getServerIsDesktop,
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sandboxRef = useRef<HTMLDivElement>(null);

    const modeRef = useRef(mode);
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    const registerInteraction = useCallback(() => {
        // Reset user state only when transitioning into user mode. Read mode
        // from a ref so this callback stays stable and the updater stays pure.
        if (modeRef.current !== 'user') {
            setUserQuery('');
        }
        setMode('user');
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            setMode('auto');
            setAutoIndex(0);
            setAutoTyped(firstQuery);
            setAutoPhase('settled');
            setUserQuery('');
            inputRef.current?.blur();
        }, IDLE_TIMEOUT_MS);
    }, [firstQuery]);

    useEffect(() => {
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const node = sandboxRef.current;
        if (!node) return;
        if (typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    setInView(entry.isIntersecting);
                }
            },
            { threshold: 0.3 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (mode !== 'auto') return;
        if (safeItems.length <= 1) return;
        if (!inView) return;
        if (!isDesktop) return;

        let cancelled = false;
        const cycleTimeouts: ReturnType<typeof setTimeout>[] = [];
        const schedule = (fn: () => void, ms: number) => {
            cycleTimeouts.push(setTimeout(fn, ms));
        };

        const runHold = (atIdx: number) => {
            if (cancelled) return;
            setAutoPhase('settled');
            const currentQuery = safeItems[atIdx]!.query;
            schedule(() => {
                if (cancelled) return;
                setAutoPhase('deleting');
                deleteChars(currentQuery.length, currentQuery, atIdx);
            }, HOLD_MS);
        };

        const deleteChars = (n: number, original: string, fromIdx: number) => {
            if (cancelled) return;
            if (n <= 0) {
                setAutoPhase('idle');
                schedule(() => {
                    if (cancelled) return;
                    const nextIdx = (fromIdx + 1) % safeItems.length;
                    setAutoPhase('typing');
                    typeChars(1, safeItems[nextIdx]!.query, nextIdx);
                }, IDLE_MS);
                return;
            }
            setAutoTyped(original.slice(0, n - 1));
            schedule(() => deleteChars(n - 1, original, fromIdx), DELETE_MS_PER_CHAR);
        };

        const typeChars = (n: number, target: string, nextIdx: number) => {
            if (cancelled) return;
            setAutoTyped(target.slice(0, n));
            if (n >= target.length) {
                setAutoPhase('fetching');
                schedule(() => {
                    if (cancelled) return;
                    setAutoIndex(nextIdx);
                    runHold(nextIdx);
                }, FETCH_BEAT_MS);
                return;
            }
            schedule(() => typeChars(n + 1, target, nextIdx), TYPE_MS_PER_CHAR);
        };

        runHold(autoIndex);

        return () => {
            cancelled = true;
            cycleTimeouts.forEach(clearTimeout);
        };
        // autoIndex intentionally excluded — owned by the cycle after it starts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, safeItems, inView, isDesktop]);

    const trimmedUser = userQuery.trim();

    useEffect(() => {
        if (trimmedUser.length === 0) {
            setDebouncedUserQuery('');
            return;
        }
        const handle = setTimeout(
            () => setDebouncedUserQuery(trimmedUser),
            USER_FETCH_DEBOUNCE_MS,
        );
        return () => clearTimeout(handle);
    }, [trimmedUser]);

    const { data: fetchedUserResult } = useQuery({
        queryKey: ['assets-api-sandbox-user-result', debouncedUserQuery, limit],
        queryFn: ({ signal }) => fetchUserResult(debouncedUserQuery, limit, signal),
        enabled: mode === 'user' && debouncedUserQuery.length > 0,
        retry: false,
    });
    const userResult: UserResult | null =
        mode === 'user' && trimmedUser.length > 0 && trimmedUser === debouncedUserQuery
            ? (fetchedUserResult ?? null)
            : null;

    if (safeItems.length === 0) return null;

    const fallbackSnapshot = safeItems[autoIndex] ?? safeItems[0]!;

    let displayData: AssetVariantsResponse;
    let displayStatus: number | null;
    let displayRequestPath: string;
    if (mode === 'user') {
        if (trimmedUser.length === 0) {
            displayData = fallbackSnapshot.data;
            displayStatus = fallbackSnapshot.status;
            displayRequestPath = fallbackSnapshot.requestPath;
        } else if (userResult) {
            displayData = userResult.data;
            displayStatus = userResult.status;
            displayRequestPath = userResult.requestPath;
        } else {
            displayData = { assetId: '', variants: [] };
            displayStatus = null;
            displayRequestPath = toSearchPath(trimmedUser, limit);
        }
    } else {
        displayData = fallbackSnapshot.data;
        displayStatus = fallbackSnapshot.status;
        displayRequestPath = fallbackSnapshot.requestPath;
    }
    const safeResults = Array.isArray(displayData.variants) ? displayData.variants : [];
    const allResults = safeResults
        .slice()
        .sort((a, b) => (b.market?.liquidity ?? 0) - (a.market?.liquidity ?? 0))
        .map(variantToCardResult)
        .slice(0, isDesktop ? VISIBLE_RESULTS : VISIBLE_RESULTS_MOBILE);

    const userPhase: Phase =
        trimmedUser.length === 0
            ? 'settled'
            : userResult !== null
              ? 'settled'
              : 'fetching';
    const phase: Phase = mode === 'auto' ? autoPhase : userPhase;
    const showSettled = phase === 'settled' || phase === 'deleting';
    const displayResults = !showSettled ? [] : allResults;
    const finalStatus: number | null = !showSettled ? null : displayStatus;
    const settleKey: string | number = mode === 'user' ? trimmedUser : autoIndex;

    return (
        <div
            ref={sandboxRef}
            className="sandbox-enter w-full border-x border-[#2c2c2d] bg-[#0F0F10]"
            style={{ animationDelay: '420ms' }}
        >
            <TopBar status={finalStatus} requestPath={displayRequestPath} />
            <div className="flex flex-col md:h-[640px] md:flex-row md:items-stretch">
                <LeftPanel
                    results={displayResults}
                    phase={phase}
                    settleKey={settleKey}
                    mode={mode}
                    autoTyped={autoTyped}
                    userQuery={userQuery}
                    inputRef={inputRef}
                    onInteract={registerInteraction}
                    onUserChange={setUserQuery}
                />
                <RightPanel
                    data={displayData}
                    phase={phase}
                    settleKey={settleKey}
                    stream={mode === 'auto' && isDesktop}
                    isMobile={!isDesktop}
                />
            </div>
        </div>
    );
}
