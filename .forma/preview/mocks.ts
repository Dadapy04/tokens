'use client';

import * as React from 'react';
import type { PreviewEnv } from './config';
import { appendSearchParam } from './search-params';

const PREVIEW_VIEWPORT_WIDTH = 1440;
const DEFAULT_ENV: PreviewEnv = {
    pathname: '/',
    searchParams: {},
};

const PREVIEW_MARKETS = [
    {
        address: 'ORCA_SOL_USDC_POOL',
        name: 'SOL-USDC',
        source: 'Orca Whirlpool',
        liquidity: 18_450_000,
        volume24h: 9_230_000,
        trade24h: 51_220,
        base: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Wrapped SOL',
        },
        quote: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            name: 'USD Coin',
        },
    },
    {
        address: 'RAYDIUM_SOL_USDC_POOL',
        name: 'SOL-USDC',
        source: 'Raydium CLMM',
        liquidity: 14_800_000,
        volume24h: 6_540_000,
        trade24h: 42_100,
        base: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Wrapped SOL',
        },
        quote: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            name: 'USD Coin',
        },
    },
    {
        address: 'BYREAL_SOL_USDC_POOL',
        name: 'SOL-USDC',
        source: 'Byreal',
        liquidity: 6_200_000,
        volume24h: 2_410_000,
        trade24h: 18_440,
        base: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Wrapped SOL',
        },
        quote: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            name: 'USD Coin',
        },
    },
    {
        address: 'METEORA_SOL_USDC_POOL',
        name: 'SOL-USDC',
        source: 'Meteora DLMM',
        liquidity: 4_500_000,
        volume24h: 1_860_000,
        trade24h: 12_030,
        base: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Wrapped SOL',
        },
        quote: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            name: 'USD Coin',
        },
    },
] as const;

const previewRouter = {
    back() {},
    forward() {},
    push() {},
    replace() {},
    refresh() {},
    prefetch() {
        return Promise.resolve();
    },
};

const PreviewNavigationContext = React.createContext<PreviewEnv>(DEFAULT_ENV);

function toSearchParams(value: PreviewEnv['searchParams'] | undefined): URLSearchParams {
    const params = new URLSearchParams();
    if (!value) return params;

    for (const [key, rawValue] of Object.entries(value)) {
        appendSearchParam(params, key, rawValue);
    }

    return params;
}

function toSearchParamsCacheKey(value: PreviewEnv['searchParams'] | undefined): string {
    if (!value) return '';

    const params = new URLSearchParams();
    for (const key of Object.keys(value).sort()) {
        appendSearchParam(params, key, value[key]);
    }

    return params.toString();
}

function usePreviewEnv(): PreviewEnv {
    return React.useContext(PreviewNavigationContext);
}

function buildAssetMarketsResponse() {
    return {
        includes: {
            markets: {
                ok: true,
                data: {
                    markets: PREVIEW_MARKETS,
                    total: PREVIEW_MARKETS.length,
                    offset: 0,
                    limit: 50,
                },
            },
        },
    };
}

function buildEmptyMarketsResponse() {
    return {
        includes: {
            markets: {
                ok: true,
                data: {
                    markets: [],
                    total: 0,
                    offset: 0,
                    limit: 50,
                },
            },
        },
    };
}

function installMatchMediaMock() {
    if (typeof window === 'undefined') return;
    if (typeof window.matchMedia === 'function') return;

    window.matchMedia = (query: string): MediaQueryList => {
        const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/i);
        const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/i);

        const matchesMin = minWidthMatch ? PREVIEW_VIEWPORT_WIDTH >= Number(minWidthMatch[1]) : true;
        const matchesMax = maxWidthMatch ? PREVIEW_VIEWPORT_WIDTH <= Number(maxWidthMatch[1]) : true;
        const matches = matchesMin && matchesMax;

        return {
            matches,
            media: query,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent() {
                return false;
            },
        };
    };
}

function installResizeObserverMock() {
    if (typeof window === 'undefined') return;
    if ('ResizeObserver' in window) return;

    class PreviewResizeObserver implements ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    Object.assign(window, { ResizeObserver: PreviewResizeObserver });
}

function installIntersectionObserverMock() {
    if (typeof window === 'undefined') return;
    if ('IntersectionObserver' in window) return;

    class PreviewIntersectionObserver implements IntersectionObserver {
        readonly root = null;
        readonly rootMargin = '0px';
        readonly thresholds = [0];

        disconnect() {}
        observe() {}
        takeRecords() {
            return [];
        }
        unobserve() {}
    }

    Object.assign(window, { IntersectionObserver: PreviewIntersectionObserver });
}

function installAnalyticsMocks() {
    if (typeof window === 'undefined') return;

    const noop = () => {};

    if (!('posthog' in window)) {
        Object.assign(window, {
            posthog: {
                capture: noop,
                identify: noop,
                reset: noop,
                set_config: noop,
            },
        });
    }
}

function installFetchMock() {
    if (typeof globalThis.fetch !== 'function') return;

    const currentFetch = globalThis.fetch as typeof fetch & { __formaPreviewPatched?: boolean };
    if (currentFetch.__formaPreviewPatched) return;

    const originalFetch = currentFetch.bind(globalThis);

    const previewFetch: typeof fetch & { __formaPreviewPatched?: boolean } = async (input, init) => {
        const requestUrl =
            typeof input === 'string' || input instanceof URL
                ? new URL(input.toString(), 'http://localhost')
                : new URL(input.url, 'http://localhost');

        if (requestUrl.pathname === '/api/v1/assets/solana') {
            return new Response(JSON.stringify(buildAssetMarketsResponse()), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                },
            });
        }

        if (requestUrl.pathname.startsWith('/api/v1/assets/')) {
            return new Response(JSON.stringify(buildEmptyMarketsResponse()), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                },
            });
        }

        return originalFetch(input, init);
    };

    previewFetch.__formaPreviewPatched = true;
    globalThis.fetch = previewFetch;
}

let installed = false;

export function installDeterministicPreviewMocks() {
    if (installed) return;
    installed = true;

    installMatchMediaMock();
    installResizeObserverMock();
    installIntersectionObserverMock();
    installAnalyticsMocks();
    installFetchMock();
}

export function PreviewNavigationProvider({ children, env }: { children: React.ReactNode; env: PreviewEnv }) {
    return React.createElement(PreviewNavigationContext.Provider, { value: env }, children);
}

export function usePathname() {
    return usePreviewEnv().pathname;
}

export function useRouter() {
    return previewRouter;
}

export function useSearchParams() {
    const env = usePreviewEnv();
    const cacheKey = React.useMemo(() => toSearchParamsCacheKey(env.searchParams), [env.searchParams]);
    // Depend on a canonical key so logically identical search params reuse the same URLSearchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => toSearchParams(env.searchParams), [cacheKey]);
}

export function redirect(destination: string): never {
    throw new Error(`Forma preview redirect() is not supported: ${destination}`);
}

export function notFound(): never {
    throw new Error('Forma preview notFound() is not supported.');
}
