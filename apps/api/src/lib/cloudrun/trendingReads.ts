import type {
    TrendingListResult,
    FreshTrendingListResult,
} from '../../../../cloudrun-assets/src/handlers/trendingReads';

import { getCloudRunClient } from './client';

type AssetCategory =
    | 'crypto'
    | 'stablecoin'
    | 'lst'
    | 'rwa'
    | 'commodity'
    | 'equity'
    | 'etf'
    | 'index';

export type TrendingMarketsListArgs = { category?: AssetCategory; limit?: number; offset?: number };
export type TrendingMarketsListResult = TrendingListResult;

export async function trendingMarketsList(args: TrendingMarketsListArgs): Promise<TrendingMarketsListResult> {
    return getCloudRunClient().query<TrendingMarketsListResult>('assets', 'trendingMarketsList', {
        ...args,
    });
}

export type FreshTrendingMarketsListArgs = TrendingMarketsListArgs;
export type FreshTrendingMarketsListResult = FreshTrendingListResult;

export async function freshTrendingMarketsList(
    args: FreshTrendingMarketsListArgs,
): Promise<FreshTrendingMarketsListResult> {
    return getCloudRunClient().query<FreshTrendingMarketsListResult>('assets', 'freshTrendingMarketsList', {
        ...args,
    });
}
