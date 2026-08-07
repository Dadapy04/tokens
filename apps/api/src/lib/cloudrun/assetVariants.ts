import type {
    AssetVariantResult,
    ListByAssetIdsEntry,
    ListByMintsEntry,
    SolanaDefaultVariantsViewResult,
    ListSolanaVariantsForApiResult as HandlerListSolanaVariantsForApiResult,
} from '../../../../cloudrun-assets/src/handlers/assetVariants';

import { getCloudRunClient } from './client';

export type GetByMintArgs = { mint: string; includeInactive?: boolean };
export type GetByMintResult = AssetVariantResult | null;

export async function getByMint(args: GetByMintArgs): Promise<GetByMintResult> {
    return getCloudRunClient().query<GetByMintResult>('assets', 'assetVariantsGetByMint', { ...args });
}

export type ListByAssetIdsArgs = { assetIds: string[]; includeInactive?: boolean };
export type ListByAssetIdsResult = ListByAssetIdsEntry[];

export async function listByAssetIds(args: ListByAssetIdsArgs): Promise<ListByAssetIdsResult> {
    return getCloudRunClient().query<ListByAssetIdsResult>('assets', 'assetVariantsListByAssetIds', { ...args });
}

export type ListByMintsArgs = { mints: string[]; includeInactive?: boolean };
export type ListByMintsResult = ListByMintsEntry[];

export async function listByMints(args: ListByMintsArgs): Promise<ListByMintsResult> {
    return getCloudRunClient().query<ListByMintsResult>('assets', 'assetVariantsListByMints', { ...args });
}

export type GetSolanaDefaultVariantsViewForApiArgs = Record<string, never>;
export type GetSolanaDefaultVariantsViewForApiResult = SolanaDefaultVariantsViewResult | null;

export async function getSolanaDefaultVariantsViewForApi(): Promise<GetSolanaDefaultVariantsViewForApiResult> {
    return getCloudRunClient().query<GetSolanaDefaultVariantsViewForApiResult>(
        'assets',
        'assetVariantsGetSolanaDefaultVariantsViewForApi',
        {},
    );
}

export type ListSolanaVariantsForApiArgs = {
    kind?:
        | 'native'
        | 'wrapped'
        | 'bridged'
        | 'spot'
        | 'etf'
        | 'yield'
        | 'leveraged'
        | 'basket'
        | 'lst'
        | 'stablecoin'
        | 'tokenized_equity';
    tierFilter?: 'tier1' | 'tier2' | 'tier3';
    requestedMint?: string;
    variantsMode?: string;
};
export type ListSolanaVariantsForApiResult = HandlerListSolanaVariantsForApiResult;

export async function listSolanaVariantsForApi(
    args: ListSolanaVariantsForApiArgs = {},
): Promise<ListSolanaVariantsForApiResult> {
    return getCloudRunClient().query<ListSolanaVariantsForApiResult>(
        'assets',
        'assetVariantsListSolanaVariantsForApi',
        { ...args },
    );
}
