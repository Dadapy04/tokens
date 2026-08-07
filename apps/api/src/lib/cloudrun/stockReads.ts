import type {
    StockInstrumentResult,
    StockPriceResult,
    GetInstrumentsByAssetIdsEntry,
    GetPricesByAssetIdsEntry,
} from '../../../../cloudrun-assets/src/handlers/stockReads';

import { getCloudRunClient } from './client';

export type GetInstrumentByAssetIdArgs = { assetId: string; includeInactive?: boolean };
export type GetInstrumentByAssetIdResult = StockInstrumentResult | null;

export async function stockInstrumentsGetByAssetId(
    args: GetInstrumentByAssetIdArgs,
): Promise<GetInstrumentByAssetIdResult> {
    return getCloudRunClient().query<GetInstrumentByAssetIdResult>(
        'assets',
        'stockInstrumentsGetByAssetId',
        { ...args },
    );
}

export type GetInstrumentsByAssetIdsArgs = { assetIds: string[]; includeInactive?: boolean };
export type GetInstrumentsByAssetIdsResult = GetInstrumentsByAssetIdsEntry[];

export async function stockInstrumentsGetByAssetIds(
    args: GetInstrumentsByAssetIdsArgs,
): Promise<GetInstrumentsByAssetIdsResult> {
    return getCloudRunClient().query<GetInstrumentsByAssetIdsResult>(
        'assets',
        'stockInstrumentsGetByAssetIds',
        { ...args },
    );
}

export type GetPriceLatestByAssetIdArgs = { assetId: string };
export type GetPriceLatestByAssetIdResult = StockPriceResult | null;

export async function stockPricesGetLatestByAssetId(
    args: GetPriceLatestByAssetIdArgs,
): Promise<GetPriceLatestByAssetIdResult> {
    return getCloudRunClient().query<GetPriceLatestByAssetIdResult>(
        'assets',
        'stockPricesGetLatestByAssetId',
        { ...args },
    );
}

export type GetPriceLatestByAssetIdsArgs = { assetIds: string[] };
export type GetPriceLatestByAssetIdsResult = GetPricesByAssetIdsEntry[];

export async function stockPricesGetLatestByAssetIds(
    args: GetPriceLatestByAssetIdsArgs,
): Promise<GetPriceLatestByAssetIdsResult> {
    return getCloudRunClient().query<GetPriceLatestByAssetIdsResult>(
        'assets',
        'stockPricesGetLatestByAssetIds',
        { ...args },
    );
}
