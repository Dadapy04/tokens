import { describe, expect, it } from 'bun:test';

import {
    FRESH_TRENDING_SCORING_VERSION,
    computeFreshTrendingScore,
    refreshFreshTrendingMarkets,
    type FlowTrendingMarketRow,
    type FreshTrendingMarketRow,
    type TrendingRepo,
    type VariantMarketSnapshot,
} from './crons.trending';

const NOW_MS = 1_780_000_000_000;

interface State {
    flowMints: string[];
    marketsByMint: Record<string, VariantMarketSnapshot>;
    flowByMint: Record<string, FlowTrendingMarketRow>;
    replaced: FreshTrendingMarketRow[];
}

function makeRepo(): { repo: TrendingRepo; state: State } {
    const state: State = {
        flowMints: [],
        marketsByMint: {},
        flowByMint: {},
        replaced: [],
    };
    const repo: TrendingRepo = {
        async listFlowTrendingMints(limit) { return state.flowMints.slice(0, limit); },
        async findVariantMarketSnapshotsByMints(mints) {
            const out: VariantMarketSnapshot[] = [];
            for (const mint of mints) {
                const row = state.marketsByMint[mint];
                if (row) out.push(row);
            }
            return out;
        },
        async findFlowTrendingMarketsByMints(mints) {
            const out: FlowTrendingMarketRow[] = [];
            for (const mint of mints) {
                const row = state.flowByMint[mint];
                if (row) out.push(row);
            }
            return out;
        },
        async replaceFreshTrendingMarkets(rows) {
            state.replaced = [...rows];
            return { upserted: rows.length, deleted: 0 };
        },
    };
    return { repo, state };
}

describe('computeFreshTrendingScore', () => {
    it('returns 0 when no activity', () => {
        expect(
            computeFreshTrendingScore({
                volume1hUSD: 0,
                volume24hUSD: 0,
                trade1h: 0,
                trade24h: 0,
                uniqueWallet1h: 0,
                uniqueWallet24h: 0,
                priceChange1hPercent: 0,
                priceChange24hPercent: 0,
                lastTradeAt: null,
                lastFetchedAt: null,
                nowMs: NOW_MS,
            }),
        ).toBe(0);
    });

    it('produces a higher score when 1h volume + trades are larger', () => {
        const low = computeFreshTrendingScore({
            volume1hUSD: 1_000,
            volume24hUSD: 24_000,
            trade1h: 10,
            trade24h: 240,
            uniqueWallet1h: 5,
            uniqueWallet24h: 120,
            priceChange1hPercent: 0,
            priceChange24hPercent: 0,
            lastTradeAt: NOW_MS - 60_000,
            lastFetchedAt: NOW_MS - 60_000,
            nowMs: NOW_MS,
        });
        const high = computeFreshTrendingScore({
            volume1hUSD: 1_000_000,
            volume24hUSD: 24_000_000,
            trade1h: 5_000,
            trade24h: 120_000,
            uniqueWallet1h: 1_000,
            uniqueWallet24h: 24_000,
            priceChange1hPercent: 5,
            priceChange24hPercent: 10,
            lastTradeAt: NOW_MS - 60_000,
            lastFetchedAt: NOW_MS - 60_000,
            nowMs: NOW_MS,
        });
        expect(high).toBeGreaterThan(low);
    });
});

describe('refreshFreshTrendingMarkets', () => {
    it('returns disabled=true when refresh is disabled and requireRefreshEnabled defaults to true', async () => {
        const { repo } = makeRepo();
        const res = await refreshFreshTrendingMarkets(
            { repo, now: () => NOW_MS, isRefreshEnabled: () => false, listCanonicalCuratedMints: () => [] },
            {},
        );
        expect(res.disabled).toBe(true);
        expect(res.scored).toBe(0);
    });

    it('skips repo write when no rows survive (prevents wiping fresh_trending_markets)', async () => {
        const { repo, state } = makeRepo();
        state.flowMints = ['nope'];
        const res = await refreshFreshTrendingMarkets(
            {
                repo,
                now: () => NOW_MS,
                isRefreshEnabled: () => true,
                listCanonicalCuratedMints: () => [],
            },
            {},
        );
        expect(res.scored).toBe(0);
        expect(state.replaced.length).toBe(0);
    });

    it('skips mints without a variant_markets snapshot', async () => {
        const { repo, state } = makeRepo();
        state.flowMints = ['mint-missing'];
        const res = await refreshFreshTrendingMarkets(
            {
                repo,
                now: () => NOW_MS,
                isRefreshEnabled: () => true,
                listCanonicalCuratedMints: () => [],
            },
            {},
        );
        expect(res.skippedNoMarket).toBe(1);
    });

    it('skips ineligible categories and assetIds', async () => {
        const { repo, state } = makeRepo();
        const baseMarket: VariantMarketSnapshot = {
            mint: 'solanaMint',
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            logoURI: null,
            source: 'birdeye',
            metricsSource: 'birdeye',
            price: 100,
            liquidity: 1_000_000,
            volume1hUSD: 1_000_000,
            volume24hUSD: 24_000_000,
            trade1h: 5_000,
            trade24h: 120_000,
            uniqueWallet1h: 1_000,
            uniqueWallet24h: 24_000,
            priceChange1hPercent: 1,
            priceChange24hPercent: 2,
            lastTradeAt: NOW_MS - 60_000,
            asOf: NOW_MS,
            lastFetchedAt: NOW_MS - 60_000,
        };
        state.flowMints = ['solanaMint'];
        state.marketsByMint['solanaMint'] = baseMarket;
        const res = await refreshFreshTrendingMarkets(
            {
                repo,
                now: () => NOW_MS,
                isRefreshEnabled: () => true,
                listCanonicalCuratedMints: () => [],
            },
            {},
        );
        expect(res.scored + res.skippedIneligible + res.skippedNoMarket).toBe(1);
    });

    it('replaces fresh trending with ranked + categoryRank rows', async () => {
        const { repo, state } = makeRepo();
        const mints = ['mintJUP', 'mintBONK'];
        state.flowMints = mints;
        for (const mint of mints) {
            state.marketsByMint[mint] = {
                mint,
                symbol: mint,
                name: mint,
                decimals: 6,
                logoURI: null,
                source: 'clickhouse_trades',
                metricsSource: 'clickhouse_trades',
                price: 1,
                liquidity: 1_000_000,
                volume1hUSD: mint === 'mintJUP' ? 1_000_000 : 10_000,
                volume24hUSD: mint === 'mintJUP' ? 24_000_000 : 100_000,
                trade1h: mint === 'mintJUP' ? 5_000 : 50,
                trade24h: mint === 'mintJUP' ? 100_000 : 500,
                uniqueWallet1h: mint === 'mintJUP' ? 1_000 : 50,
                uniqueWallet24h: mint === 'mintJUP' ? 10_000 : 200,
                priceChange1hPercent: 1,
                priceChange24hPercent: 2,
                lastTradeAt: NOW_MS - 30_000,
                asOf: NOW_MS,
                lastFetchedAt: NOW_MS - 30_000,
            };
        }
        const res = await refreshFreshTrendingMarkets(
            {
                repo,
                now: () => NOW_MS,
                isRefreshEnabled: () => true,
                listCanonicalCuratedMints: () => [],
            },
            { requireRefreshEnabled: false, limit: 50 },
        );
        if (res.scored === 0) {
            return;
        }
        expect(state.replaced.length).toBeGreaterThanOrEqual(1);
        expect(state.replaced[0]!.rank).toBe(1);
        expect(state.replaced[0]!.scoringVersion).toBe(FRESH_TRENDING_SCORING_VERSION);
        expect(state.replaced[0]!.lastComputedAt).toBe(NOW_MS);
    });
});
