import { NextResponse } from 'next/server';

import type { PerpsMarket, PerpsMarketProviderId, PerpsMarketsResponse } from '@/lib/perps-markets';

const FLASH_API_ORIGIN = 'https://flashapi.trade';
const PHOENIX_API_ORIGIN = 'https://perp-api.phoenix.trade';
const PROVIDER_FETCH_TIMEOUT_MS = 4_000;
const CACHE_MAX_AGE_SECONDS = 5 * 60;
const CACHE_STALE_SECONDS = 30 * 60;

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

interface FlashToken {
    symbol?: unknown;
    mintKey?: unknown;
    pythTicker?: unknown;
}

interface FlashRawCustody {
    pubkey?: unknown;
    account?: {
        tokenMint?: unknown;
        permissions?: {
            tradeInit?: unknown;
        };
    };
}

interface FlashRawMarket {
    pubkey?: unknown;
    account?: {
        targetCustody?: unknown;
        permissions?: {
            tradeInit?: unknown;
        };
    };
}

interface PhoenixMarket {
    symbol?: unknown;
    marketStatus?: unknown;
    metadata?: {
        name?: unknown;
        coinGeckoId?: unknown;
        tokensXyzAssetId?: unknown;
    };
}

export async function GET(): Promise<Response> {
    const [flashResult, phoenixResult] = await Promise.allSettled([
        fetchFlashTradeMarkets(),
        fetchPhoenixTradeMarkets(),
    ]);

    const flashMarkets = flashResult.status === 'fulfilled' ? flashResult.value : [];
    const phoenixMarkets = phoenixResult.status === 'fulfilled' ? phoenixResult.value : [];

    const body: PerpsMarketsResponse = {
        markets: [...flashMarkets, ...phoenixMarkets],
        providerStatuses: {
            flashtrade: providerStatus(flashResult),
            phoenixtrade: providerStatus(phoenixResult),
        },
        updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(body, {
        headers: {
            'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`,
        },
    });
}

function providerStatus(
    result: PromiseSettledResult<PerpsMarket[]>,
): PerpsMarketsResponse['providerStatuses'][PerpsMarketProviderId] {
    if (result.status === 'fulfilled') return { ok: true, count: result.value.length };
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return { ok: false, count: 0, error: message };
}

async function fetchFlashTradeMarkets(): Promise<PerpsMarket[]> {
    const [tokens, custodies, markets] = await Promise.all([
        fetchProviderJson<FlashToken[]>(`${FLASH_API_ORIGIN}/v2/tokens`),
        fetchProviderJson<FlashRawCustody[]>(`${FLASH_API_ORIGIN}/v2/raw/custodies`),
        fetchProviderJson<FlashRawMarket[]>(`${FLASH_API_ORIGIN}/v2/raw/markets`),
    ]);

    const tokenByMint = new Map<string, FlashToken>();
    for (const token of arrayOrEmpty(tokens)) {
        const mint = stringValue(token.mintKey);
        if (mint) tokenByMint.set(mint, token);
    }

    const custodyByPubkey = new Map<string, FlashRawCustody['account']>();
    for (const custody of arrayOrEmpty(custodies)) {
        const pubkey = stringValue(custody.pubkey);
        if (pubkey) custodyByPubkey.set(pubkey, custody.account);
    }

    const bySymbol = new Map<string, PerpsMarket>();

    for (const market of arrayOrEmpty(markets)) {
        if (!isTradeEnabled(market.account?.permissions)) continue;

        const targetCustody = stringValue(market.account?.targetCustody);
        if (!targetCustody) continue;

        const custody = custodyByPubkey.get(targetCustody);
        if (!custody || !isTradeEnabled(custody.permissions)) continue;

        const tokenMint = stringValue(custody.tokenMint);
        const token = tokenMint ? tokenByMint.get(tokenMint) : undefined;
        const symbol = normalizeMarketSymbol(stringValue(token?.symbol));
        if (!symbol || symbol === 'USDC') continue;

        bySymbol.set(symbol, {
            providerId: 'flashtrade',
            symbol,
            displaySymbol: symbol,
            quoteSymbol: 'USDC',
            href: getFlashTradePerpsUrl(symbol),
            lookupKeys: compactUnique([
                symbol,
                tokenMint,
                stringValue(token?.pythTicker),
                getPythTickerBase(token?.pythTicker),
            ]),
            status: 'active',
        });
    }

    return sortMarkets(bySymbol.values());
}

async function fetchPhoenixTradeMarkets(): Promise<PerpsMarket[]> {
    const markets = await fetchProviderJson<PhoenixMarket[]>(`${PHOENIX_API_ORIGIN}/exchange/markets`);
    const bySymbol = new Map<string, PerpsMarket>();

    for (const market of arrayOrEmpty(markets)) {
        const symbol = normalizeMarketSymbol(stringValue(market.symbol));
        if (!symbol) continue;

        const status = normalizeLower(stringValue(market.marketStatus));
        if (status && status !== 'active') continue;

        bySymbol.set(symbol, {
            providerId: 'phoenixtrade',
            symbol,
            displaySymbol: symbol,
            quoteSymbol: 'USDC',
            href: getPhoenixTradePerpsUrl(symbol),
            lookupKeys: compactUnique([
                symbol,
                stringValue(market.metadata?.name),
                stringValue(market.metadata?.coinGeckoId),
                stringValue(market.metadata?.tokensXyzAssetId),
            ]),
            status: status || 'active',
        });
    }

    return sortMarkets(bySymbol.values());
}

async function fetchProviderJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
        headers: { accept: 'application/json' },
        next: { revalidate: CACHE_MAX_AGE_SECONDS },
        signal: AbortSignal.timeout(PROVIDER_FETCH_TIMEOUT_MS),
    } satisfies NextFetchInit);

    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    return (await res.json()) as T;
}

function isTradeEnabled(permissions: { tradeInit?: unknown } | undefined): boolean {
    return permissions?.tradeInit === true;
}

function getFlashTradePerpsUrl(marketSymbol: string): string {
    return `https://www.flash.trade/USDC-${encodeURIComponent(marketSymbol)}`;
}

function getPhoenixTradePerpsUrl(marketSymbol: string): string {
    return `https://www.phoenix.trade/${encodeURIComponent(marketSymbol)}`;
}

function getPythTickerBase(value: unknown): string | null {
    const ticker = stringValue(value);
    if (!ticker) return null;

    const pair = ticker.split('.').at(-1) ?? ticker;
    return pair.split('/')[0] ?? null;
}

function normalizeMarketSymbol(value: string | undefined | null): string {
    return (value ?? '').trim().toUpperCase();
}

function normalizeLower(value: string | undefined | null): string {
    return (value ?? '').trim().toLowerCase();
}

function stringValue(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function arrayOrEmpty<T>(value: T[] | undefined | null): T[] {
    return Array.isArray(value) ? value : [];
}

function compactUnique(values: Array<string | null | undefined>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const value of values) {
        const trimmed = value?.trim();
        if (!trimmed) continue;

        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        out.push(trimmed);
    }

    return out;
}

function sortMarkets(markets: Iterable<PerpsMarket>): PerpsMarket[] {
    return Array.from(markets).sort((a, b) => a.symbol.localeCompare(b.symbol));
}
