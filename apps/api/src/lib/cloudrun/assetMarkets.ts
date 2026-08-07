import type {
    AssetMarketAggregate,
    GetLatestByAssetIdsEntry,
} from '../../../../cloudrun-assets/src/handlers/assetMarkets';

import { getCloudRunClient } from './client';

export type GetLatestByAssetIdArgs = { assetId: string };
export type GetLatestByAssetIdResult = AssetMarketAggregate | null;

export async function getLatestByAssetId(args: GetLatestByAssetIdArgs): Promise<GetLatestByAssetIdResult> {
    return getCloudRunClient().query<GetLatestByAssetIdResult>('assets', 'assetMarketsGetLatestByAssetId', {
        ...args,
    });
}

export type GetLatestByAssetIdsArgs = { assetIds: string[] };
export type GetLatestByAssetIdsResult = GetLatestByAssetIdsEntry[];

export async function getLatestByAssetIds(args: GetLatestByAssetIdsArgs): Promise<GetLatestByAssetIdsResult> {
    return getCloudRunClient().query<GetLatestByAssetIdsResult>('assets', 'assetMarketsGetLatestByAssetIds', {
        ...args,
    });
}
