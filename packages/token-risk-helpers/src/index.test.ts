import { describe, expect, test } from 'bun:test';

import { computeMarketScore, type MarketScoreInput } from './index';

const BASE_INPUT: MarketScoreInput = {
    liquidityUsd: 1_000_000,
    marketCapUsd: 10_000_000,
    holderCount: 5_000,
    top10HoldersPercent: null,
    volume24hUsd: 500_000,
    volume7dUsd: 3_500_000,
    tokenMintTime: null,
    tokenAddress: 'Test111111111111111111111111111111111111111',
};

describe('computeMarketScore', () => {
    test('marks missing liquidity and market cap as insufficient data', () => {
        const result = computeMarketScore({
            ...BASE_INPUT,
            liquidityUsd: null,
            marketCapUsd: null,
            volume24hUsd: null,
            volume7dUsd: null,
            holderCount: null,
            top10HoldersPercent: null,
        });

        expect(result.hasInsufficientData).toBe(true);
        expect(result.score).toBe(0);
        expect(result.grade).toBe('C');
        expect(result.tone).toBe('risk');
        expect(result.label).toBe('Insufficient Data');
    });

    test('scores holder concentration worse as top-holder share increases', () => {
        const lowConcentration = computeMarketScore({ ...BASE_INPUT, top10HoldersPercent: 20 });
        const mediumConcentration = computeMarketScore({ ...BASE_INPUT, top10HoldersPercent: 50 });
        const highConcentration = computeMarketScore({ ...BASE_INPUT, top10HoldersPercent: 80 });

        expect(lowConcentration.components.holderDistribution.score).toBe(100);
        expect(mediumConcentration.components.holderDistribution.score).toBe(40);
        expect(highConcentration.components.holderDistribution.score).toBe(0);
    });
});
