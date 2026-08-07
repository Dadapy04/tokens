import type { LiquidityTier } from './types';

export const LIQUIDITY_TIER_1_MIN_USD = 10_000_000;
export const LIQUIDITY_TIER_2_MIN_USD = 2_500_000;

export function classifyLiquidityTier(liquidityUsd: number | null | undefined): LiquidityTier {
    if (typeof liquidityUsd !== 'number' || !Number.isFinite(liquidityUsd)) return 'tier3';
    if (liquidityUsd > LIQUIDITY_TIER_1_MIN_USD) return 'tier1';
    if (liquidityUsd >= LIQUIDITY_TIER_2_MIN_USD) return 'tier2';
    return 'tier3';
}

export function liquidityTierPriority(tier: LiquidityTier): number {
    switch (tier) {
        case 'tier1':
            return 3;
        case 'tier2':
            return 2;
        case 'tier3':
            return 1;
        default:
            return 0;
    }
}

export function normalizeLegacyTier(value: string | null | undefined): LiquidityTier | null {
    const trimmed = (value ?? '').trim().toLowerCase();
    if (!trimmed) return null;
    if (trimmed === 'experimental') return 'tier3';
    if (trimmed === 'tier1' || trimmed === 'tier2' || trimmed === 'tier3') return trimmed;
    return null;
}
