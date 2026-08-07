import type {
    AssetResult,
    AssetCoinGeckoEntry,
    GetByAssetIdsEntry,
    ResolveAssetRefResult as HandlerResolveAssetRefResult,
    ResolveAssetRefForApiResult as HandlerResolveAssetRefForApiResult,
} from '../../../../cloudrun-assets/src/handlers/assets';

import { getCloudRunClient } from './client';

export type AssetCategory =
    | 'crypto'
    | 'stablecoin'
    | 'lst'
    | 'rwa'
    | 'commodity'
    | 'equity'
    | 'etf'
    | 'index';

export type GetByAssetIdArgs = {
    assetId: string;
    includeInactive?: boolean;
};

export type GetByAssetIdResult = AssetResult | null;

export async function getByAssetId(args: GetByAssetIdArgs): Promise<GetByAssetIdResult> {
    return getCloudRunClient().query<GetByAssetIdResult>('assets', 'getByAssetId', { ...args });
}

export type GetByAssetIdsArgs = {
    assetIds: string[];
    includeInactive?: boolean;
};

export type GetByAssetIdsResult = GetByAssetIdsEntry[];

export async function getByAssetIds(args: GetByAssetIdsArgs): Promise<GetByAssetIdsResult> {
    return getCloudRunClient().query<GetByAssetIdsResult>('assets', 'getByAssetIds', { ...args });
}

export type SearchArgs = {
    query: string;
    category?: AssetCategory;
    limit?: number;
    includeInactive?: boolean;
};

export type SearchResult = AssetResult[];

export async function search(args: SearchArgs): Promise<SearchResult> {
    return getCloudRunClient().query<SearchResult>('assets', 'search', { ...args });
}

export type ResolveAssetRefArgs = {
    ref: string;
    includeInactive?: boolean;
};

export type ResolveAssetRefResult = HandlerResolveAssetRefResult | null;

export async function resolveAssetRef(args: ResolveAssetRefArgs): Promise<ResolveAssetRefResult> {
    return getCloudRunClient().query<ResolveAssetRefResult>('assets', 'resolveAssetRef', { ...args });
}

export type ResolveAssetRefForApiArgs = {
    ref: string;
    includeInactive?: boolean;
};

export type ResolveAssetRefForApiResult = HandlerResolveAssetRefForApiResult | null;

export async function resolveAssetRefForApi(
    args: ResolveAssetRefForApiArgs,
): Promise<ResolveAssetRefForApiResult> {
    return getCloudRunClient().query<ResolveAssetRefForApiResult>(
        'assets',
        'resolveAssetRefForApi',
        { ...args },
    );
}

export type ListActiveWithCoinGeckoIdsArgs = {
    limit?: number;
};

export type ListActiveWithCoinGeckoIdsResult = AssetCoinGeckoEntry[];

export async function listActiveWithCoinGeckoIds(
    args: ListActiveWithCoinGeckoIdsArgs = {},
): Promise<ListActiveWithCoinGeckoIdsResult> {
    return getCloudRunClient().query<ListActiveWithCoinGeckoIdsResult>(
        'assets',
        'listActiveWithCoinGeckoIds',
        { ...args },
    );
}

export type ListByCategoryArgs = {
    category: AssetCategory;
    limit?: number;
    includeInactive?: boolean;
};

export type ListByCategoryResult = AssetResult[];

export async function listByCategory(args: ListByCategoryArgs): Promise<ListByCategoryResult> {
    return getCloudRunClient().query<ListByCategoryResult>('assets', 'listByCategory', { ...args });
}
