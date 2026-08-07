import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';

import { fetchApiApp } from '@/lib/api-app';
import { LandingNav } from '../landing-nav';
import { buildAgentTeslaDemoData } from './agent-tesla-demo-data';
import { AssetsApiDemosPlayground, type AssetsApiDemo, type DemoId } from './playground';

export const metadata: Metadata = {
    title: 'Assets API Agent Demos | Tokens',
    description: 'Agent-first demos showing how the Assets API constrains autonomous token decisions.',
};

const WALLET_FALLBACK = {
    asset: {
        assetId: 'usd',
        name: 'US Dollar',
        symbol: 'USD',
        category: 'stablecoin',
        aliases: ['usd', 'US Dollar', 'USDC'],
        imageUrl: '/logos/currencies/usd.png',
        stats: {
            price: 1,
            liquidity: 582000000,
            volume24hUSD: 820000000,
            marketCap: 52000000000,
            priceChange24hPercent: 0.003,
        },
        primaryVariant: {
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            kind: 'stablecoin',
            label: 'USDC',
            symbol: 'USDC',
            name: 'USD Coin',
            liquidityTier: 'tier1',
            trustTier: 'tier1',
            market: {
                price: 1,
                liquidity: 582000000,
                volume24hUSD: 820000000,
                marketCap: 52000000000,
                priceChange24hPercent: 0.003,
                decimals: 6,
                logoURI: '/logos/currencies/usd.png',
                lastFetchedAt: 1766539200000,
            },
        },
    },
};

const DEMO_BASE = {
    wallet: {
        id: 'wallet',
        label: 'Neo Banking',
        eyebrow: 'Neo Banking',
        title: 'One asset, reduced complexity',
        description:
            'Bank apps usually show a single balance row. On Solana, that balance can be split across USDC, USDT, yield dollars, and issuer-specific tokens. Assets API groups those variants under one canonical US Dollar asset, so you decide what the user sees and when to reveal the details.',
        method: 'GET',
        path: '/api/v1/assets/usd',
        params: [
            {
                name: 'assetId',
                value: 'usd',
                note: 'Returns one canonical US Dollar asset with its Solana variants grouped underneath',
            },
        ],
    },
    'agent-tesla': {
        id: 'agent-tesla',
        label: 'Agent Guardrails',
        eyebrow: 'Autonomous agents',
        title: 'Verified-only Tesla decisions',
        description:
            'A generic agent can over-trust noisy token search results. Tokens API gives agentic flows a canonical Tesla asset and a verified-only variant set before any wallet action is considered.',
        method: 'GET',
        path: '/api/v1/assets/tesla/variants?liquidityTier=tier1',
        params: [
            {
                name: 'q',
                value: 'tesla',
                note: 'Resolve the user intent to the canonical Tesla asset before choosing a token.',
            },
            {
                name: 'liquidityTier',
                value: 'tier1',
                note: 'Allow only variants returned by Tokens API for canonical Tesla under the verified tier.',
            },
        ],
    },
} satisfies Record<
    DemoId,
    Omit<AssetsApiDemo, 'status' | 'data' | 'state' | 'statusLabel'> & { method: 'GET' }
>;

async function fetchWalletDemo(): Promise<AssetsApiDemo> {
    const demo = DEMO_BASE.wallet;
    try {
        const response = await fetchApiApp(demo.path, {
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(2500),
        });
        const text = await response.text();
        const data = text ? (JSON.parse(text) as unknown) : null;
        const normalized = response.ok ? normalizeWalletData(data, WALLET_FALLBACK) : WALLET_FALLBACK;

        return {
            ...demo,
            status: response.status,
            data: normalized,
            state: 'ok',
            ...(!response.ok || normalized === WALLET_FALLBACK ? { statusLabel: 'sample' } : {}),
        };
    } catch {
        return {
            ...demo,
            status: 200,
            data: WALLET_FALLBACK,
            state: 'ok',
            statusLabel: 'sample',
        };
    }
}

async function fetchAgentTeslaDemo(): Promise<AssetsApiDemo> {
    const demo = DEMO_BASE['agent-tesla'];
    const searchPath = '/api/v1/assets/search?q=tesla&limit=5';
    const variantsPath = '/api/v1/assets/tesla/variants?liquidityTier=tier1';
    const [search, variants] = await Promise.all([fetchLiveJson(searchPath), fetchLiveJson(variantsPath)]);
    const useFallbackVariants = !search.ok || !variants.ok || arrayAt(variants.data, 'variants').length === 0;

    return {
        ...demo,
        status: variants.ok ? variants.status : search.status,
        state: 'ok',
        data: buildAgentTeslaDemoData({
            rawSearch: search.data,
            rawVariants: variants.data,
            useFallbackVariants,
        }),
        ...(useFallbackVariants ? { statusLabel: 'sample' } : {}),
    };
}

async function fetchLiveJson(path: string): Promise<{ ok: boolean; status: number; data: unknown }> {
    try {
        const response = await fetchApiApp(path, {
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(3500),
        });
        const text = await response.text();
        const data = text ? (JSON.parse(text) as unknown) : null;

        return {
            ok: response.ok,
            status: response.status,
            data: response.ok ? data : { error: { message: 'Live API request failed', path, status: response.status, body: data } },
        };
    } catch (error) {
        return {
            ok: false,
            status: 500,
            data: {
                error: {
                    message: error instanceof Error ? error.message : 'Live API request failed',
                    path,
                    status: 500,
                },
            },
        };
    }
}

function normalizeWalletData(data: unknown, fallback: unknown): unknown {
    const record = asRecord(data);
    if (!record) return fallback;

    const asset = asRecord(record.asset);
    if (!asset) return fallback;

    return { asset };
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function arrayAt(value: unknown, key: string): unknown[] {
    const record = asRecord(value);
    const array = record?.[key];
    return Array.isArray(array) ? array : [];
}

export default async function AssetsApiDemosPage() {
    'use cache';
    // Whole-page cache replacing the previous `export const revalidate = 60`
    // ('minutes' revalidates every 60s).
    cacheLife('minutes');
    const demos = await Promise.all([fetchWalletDemo(), fetchAgentTeslaDemo()]);

    return (
        <main className="dark relative min-h-dvh overflow-x-hidden bg-[#0F0F10] text-text-extra-high">
            <LandingNav />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[260px]"
                style={{
                    background:
                        'radial-gradient(circle at 50% 0%, rgba(0,255,163,0.12), rgba(0,255,163,0) 32%), linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0))',
                }}
            />
            <section className="relative">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 inset-x-0 mx-auto hidden w-full max-w-[1120px] px-6 md:block"
                >
                    <div className="h-full border-x border-[#2c2c2d]" />
                </div>
                <div className="mx-auto max-w-[1120px] px-6 pt-28 pb-12 md:pt-32">
                    <div className="max-w-3xl">
                        <p className="font-berkeley-mono text-xs uppercase tracking-[0.22em] text-[#00FFA3]">
                            Assets API demos
                        </p>
                        <h1 className="mt-5 text-balance text-[42px] font-medium leading-[1.02] text-white md:text-[64px]">
                            Guardrails for autonomous token agents
                        </h1>
                        <p className="mt-6 max-w-2xl text-[16px] leading-7 text-white/58 md:text-lg">
                            See how canonical assets and verified variants keep agentic token flows from acting on noisy
                            search results.
                        </p>
                    </div>
                </div>
            </section>
            <section className="relative pb-24">
                <div aria-hidden className="h-px w-full bg-[#2c2c2d]" />
                <div className="mx-auto max-w-[1120px] px-6">
                    <AssetsApiDemosPlayground demos={demos} />
                </div>
                <div aria-hidden className="h-px w-full bg-[#2c2c2d]" />
            </section>
        </main>
    );
}
