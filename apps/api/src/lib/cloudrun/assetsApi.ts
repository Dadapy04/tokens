import type { LoadAssetBaseForApiResult as HandlerLoadAssetBaseForApiResult } from '../../../../cloudrun-assets/src/handlers/assetsApi';

import { getCloudRunClient } from './client';

export type LoadAssetBaseForApiArgs = {
    assetId: string;
    includeInactive?: boolean;
    includeVariants?: boolean;
    includeVariantMarkets?: boolean;
    includeFillQuality?: boolean;
    includeAssetMarket?: boolean;
    includeCoingeckoCoin?: boolean;
    includeStockInstrument?: boolean;
    includeStockPrice?: boolean;
};

export type LoadAssetBaseForApiResult = HandlerLoadAssetBaseForApiResult;

export async function loadAssetBaseForApi(
    args: LoadAssetBaseForApiArgs,
): Promise<LoadAssetBaseForApiResult> {
    return getCloudRunClient().query<LoadAssetBaseForApiResult>(
        'assets',
        'assetsApiLoadAssetBaseForApi',
        { ...args },
    );
}
