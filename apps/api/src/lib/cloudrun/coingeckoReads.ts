import type {
    CoingeckoCoinResult,
    CoingeckoCoinSearchResult,
    CoingeckoOhlcvRow,
    CoingeckoPriceSnapshot,
    CoingeckoPriceBatchEntry,
    CoingeckoTickersResult,
} from '../../../../cloudrun-assets/src/handlers/coingeckoReads';

import { getCloudRunClient } from './client';

export type GetCoinByIdArgs = { id: string };
export type GetCoinByIdResult = CoingeckoCoinResult | null;

export async function getCoinById(args: GetCoinByIdArgs): Promise<GetCoinByIdResult> {
    return getCloudRunClient().query<GetCoinByIdResult>('assets', 'coingeckoReadsGetCoinById', { ...args });
}

export type SearchCoinsArgs = { query: string; limit?: number };
export type SearchCoinsResult = CoingeckoCoinSearchResult[];

export async function searchCoins(args: SearchCoinsArgs): Promise<SearchCoinsResult> {
    return getCloudRunClient().query<SearchCoinsResult>('assets', 'coingeckoReadsSearchCoins', { ...args });
}

export type OhlcvInterval = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
export type ListOhlcvArgs = {
    coinId: string;
    interval: OhlcvInterval;
    from?: number;
    to?: number;
    limit?: number;
};
export type ListOhlcvResult = CoingeckoOhlcvRow[];

export async function listOhlcv(args: ListOhlcvArgs): Promise<ListOhlcvResult> {
    return getCloudRunClient().query<ListOhlcvResult>('assets', 'coingeckoReadsListOhlcv', { ...args });
}

export type GetPriceLatestByCoinIdArgs = { coinId: string };
export type GetPriceLatestByCoinIdResult = CoingeckoPriceSnapshot | null;

export async function getPriceLatestByCoinId(
    args: GetPriceLatestByCoinIdArgs,
): Promise<GetPriceLatestByCoinIdResult> {
    return getCloudRunClient().query<GetPriceLatestByCoinIdResult>(
        'assets',
        'coingeckoReadsGetPriceLatestByCoinId',
        { ...args },
    );
}

export type GetPriceLatestByCoinIdsArgs = { coinIds: string[] };
export type GetPriceLatestByCoinIdsResult = CoingeckoPriceBatchEntry[];

export async function getPriceLatestByCoinIds(
    args: GetPriceLatestByCoinIdsArgs,
): Promise<GetPriceLatestByCoinIdsResult> {
    return getCloudRunClient().query<GetPriceLatestByCoinIdsResult>(
        'assets',
        'coingeckoReadsGetPriceLatestByCoinIds',
        { ...args },
    );
}

export type GetTickersLatestByCoinIdArgs = { coinId: string };
export type GetTickersLatestByCoinIdResult = CoingeckoTickersResult | null;

export async function getTickersLatestByCoinId(
    args: GetTickersLatestByCoinIdArgs,
): Promise<GetTickersLatestByCoinIdResult> {
    return getCloudRunClient().query<GetTickersLatestByCoinIdResult>(
        'assets',
        'coingeckoReadsGetTickersLatestByCoinId',
        { ...args },
    );
}
