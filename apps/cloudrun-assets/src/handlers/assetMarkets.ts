import { InvalidArgsError } from './assets';

export interface AssetMarketRow {
    asset_id: string;
    liquidity: number;
    volume_24h_usd: number;
    volume_30d_usd: number | null;
    primary_mint: string | null;
    last_computed_at: number;
    min_variant_last_fetched_at: number | null;
    max_variant_last_fetched_at: number | null;
}

export interface AssetMarketsRepo {
    findLatestByAssetId(assetId: string): Promise<AssetMarketRow | null>;
    findLatestByAssetIds(assetIds: readonly string[]): Promise<AssetMarketRow[]>;
}

export interface AssetMarketAggregate {
    assetId: string;
    liquidity: number;
    volume24hUSD: number;
    volume30dUSD?: number | null;
    primaryMint?: string;
    lastComputedAt: number;
    minVariantLastFetchedAt?: number;
    maxVariantLastFetchedAt?: number;
}

export interface GetLatestByAssetIdsEntry {
    assetId: string;
    market: AssetMarketAggregate | null;
}

function rowToAggregate(row: AssetMarketRow): AssetMarketAggregate {
    const out: AssetMarketAggregate = {
        assetId: row.asset_id,
        liquidity: row.liquidity,
        volume24hUSD: row.volume_24h_usd,
        lastComputedAt: row.last_computed_at,
    };
    out.volume30dUSD = row.volume_30d_usd;
    if (row.primary_mint !== null) out.primaryMint = row.primary_mint;
    if (row.min_variant_last_fetched_at !== null) {
        out.minVariantLastFetchedAt = row.min_variant_last_fetched_at;
    }
    if (row.max_variant_last_fetched_at !== null) {
        out.maxVariantLastFetchedAt = row.max_variant_last_fetched_at;
    }
    return out;
}

export async function getLatestByAssetId(
    repo: AssetMarketsRepo,
    args: unknown,
): Promise<AssetMarketAggregate | null> {
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    const a = args as { assetId?: unknown };
    if (typeof a.assetId !== 'string') {
        throw new InvalidArgsError('assetId must be a string');
    }
    const assetId = a.assetId.trim();
    if (!assetId) return null;
    const row = await repo.findLatestByAssetId(assetId);
    if (!row) return null;
    return rowToAggregate(row);
}

export async function getLatestByAssetIds(
    repo: AssetMarketsRepo,
    args: unknown,
): Promise<GetLatestByAssetIdsEntry[]> {
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    const a = args as { assetIds?: unknown };
    if (!Array.isArray(a.assetIds)) {
        throw new InvalidArgsError('assetIds must be an array of strings');
    }
    for (const item of a.assetIds) {
        if (typeof item !== 'string') {
            throw new InvalidArgsError('assetIds must be an array of strings');
        }
    }
    const assetIds = (a.assetIds as string[])
        .slice(0, 500)
        .map(id => id.trim())
        .filter(id => id.length > 0);

    if (assetIds.length === 0) return [];

    const rows = await repo.findLatestByAssetIds(assetIds);
    const byId = new Map(rows.map(r => [r.asset_id, r] as const));

    return assetIds.map(assetId => {
        const row = byId.get(assetId);
        if (!row) return { assetId, market: null };
        return { assetId, market: rowToAggregate(row) };
    });
}
