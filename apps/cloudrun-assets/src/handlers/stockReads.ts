import { InvalidArgsError } from './assets';

export interface StockInstrumentRow {
    asset_id: string;
    symbol: string;
    normalized_symbol: string;
    name: string | null;
    instrument_id: number | null;
    dataset: string | null;
    is_active: boolean;
    source: string;
    last_synced_at: number;
}

export interface StockPriceRow {
    asset_id: string;
    symbol: string;
    normalized_symbol: string;
    price_usd: number | null;
    volume_24h_usd: number | null;
    price_change_24h_percent: number | null;
    shares_outstanding: number | null;
    shares_as_of: number | null;
    shares_last_fetched_at: number | null;
    as_of: number | null;
    last_fetched_at: number;
    source: string;
}

export interface StockReadsRepo {
    findInstrumentByAssetId(assetId: string): Promise<StockInstrumentRow | null>;
    findInstrumentsByAssetIds(assetIds: readonly string[]): Promise<StockInstrumentRow[]>;
    findPriceByAssetId(assetId: string): Promise<StockPriceRow | null>;
    findPricesByAssetIds(assetIds: readonly string[]): Promise<StockPriceRow[]>;
}

export interface StockInstrumentResult {
    assetId: string;
    symbol: string;
    normalizedSymbol: string;
    isActive: boolean;
    source: 'clickhouse';
    lastSyncedAt: number;
    name?: string;
    instrumentId?: number;
    dataset?: string;
}

export interface StockPriceResult {
    assetId: string;
    symbol: string;
    normalizedSymbol: string;
    priceUsd: number | null;
    volume24hUsd: number | null;
    priceChange24hPercent: number | null;
    sharesOutstanding: number | null;
    sharesAsOf: number | null;
    sharesLastFetchedAt: number | null;
    asOf: number | null;
    lastFetchedAt: number;
    source: 'clickhouse_stock';
}

export interface GetInstrumentsByAssetIdsEntry {
    assetId: string;
    instrument: StockInstrumentResult | null;
}

export interface GetPricesByAssetIdsEntry {
    assetId: string;
    snapshot: StockPriceResult | null;
}

function rowToInstrumentResult(row: StockInstrumentRow): StockInstrumentResult {
    const out: StockInstrumentResult = {
        assetId: row.asset_id,
        symbol: row.symbol,
        normalizedSymbol: row.normalized_symbol,
        isActive: row.is_active,
        source: row.source as 'clickhouse',
        lastSyncedAt: row.last_synced_at,
    };
    if (row.name !== null) out.name = row.name;
    if (row.instrument_id !== null) out.instrumentId = row.instrument_id;
    if (row.dataset !== null) out.dataset = row.dataset;
    return out;
}

function rowToPriceResult(row: StockPriceRow): StockPriceResult {
    return {
        assetId: row.asset_id,
        symbol: row.symbol,
        normalizedSymbol: row.normalized_symbol,
        priceUsd: row.price_usd,
        volume24hUsd: row.volume_24h_usd,
        priceChange24hPercent: row.price_change_24h_percent,
        sharesOutstanding: row.shares_outstanding ?? null,
        sharesAsOf: row.shares_as_of ?? null,
        sharesLastFetchedAt: row.shares_last_fetched_at ?? null,
        asOf: row.as_of,
        lastFetchedAt: row.last_fetched_at,
        source: row.source as 'clickhouse_stock',
    };
}

function asObject(args: unknown): Record<string, unknown> {
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    return args as Record<string, unknown>;
}

function readString(args: Record<string, unknown>, key: string): string {
    const value = args[key];
    if (typeof value !== 'string') {
        throw new InvalidArgsError(`${key} must be a string`);
    }
    return value;
}

function readOptionalBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
    const value = args[key];
    if (value === undefined) return undefined;
    if (typeof value !== 'boolean') {
        throw new InvalidArgsError(`${key} must be a boolean`);
    }
    return value;
}

function readStringArray(args: Record<string, unknown>, key: string): string[] {
    const raw = args[key];
    if (!Array.isArray(raw)) {
        throw new InvalidArgsError(`${key} must be an array of strings`);
    }
    for (const item of raw) {
        if (typeof item !== 'string') {
            throw new InvalidArgsError(`${key} must be an array of strings`);
        }
    }
    return raw as string[];
}

export async function getInstrumentByAssetId(
    repo: StockReadsRepo,
    args: unknown,
): Promise<StockInstrumentResult | null> {
    const a = asObject(args);
    const assetIdRaw = readString(a, 'assetId');
    const includeInactive = readOptionalBoolean(a, 'includeInactive') ?? false;
    const assetId = assetIdRaw.trim();
    if (!assetId) return null;

    const row = await repo.findInstrumentByAssetId(assetId);
    if (!row) return null;
    if (!includeInactive && !row.is_active) return null;

    return rowToInstrumentResult(row);
}

export async function getInstrumentsByAssetIds(
    repo: StockReadsRepo,
    args: unknown,
): Promise<GetInstrumentsByAssetIdsEntry[]> {
    const a = asObject(args);
    const rawList = readStringArray(a, 'assetIds');
    const includeInactive = readOptionalBoolean(a, 'includeInactive') ?? false;

    const assetIds = rawList
        .slice(0, 500)
        .map(id => id.trim())
        .filter(id => id.length > 0);

    if (assetIds.length === 0) return [];

    const rows = await repo.findInstrumentsByAssetIds(assetIds);
    const byId = new Map(rows.map(r => [r.asset_id, r] as const));

    return assetIds.map(assetId => {
        const row = byId.get(assetId);
        if (!row || (!includeInactive && !row.is_active)) {
            return { assetId, instrument: null };
        }
        return { assetId, instrument: rowToInstrumentResult(row) };
    });
}

export async function getPriceLatestByAssetId(
    repo: StockReadsRepo,
    args: unknown,
): Promise<StockPriceResult | null> {
    const a = asObject(args);
    const assetIdRaw = readString(a, 'assetId');
    const assetId = assetIdRaw.trim();
    if (!assetId) return null;

    const row = await repo.findPriceByAssetId(assetId);
    if (!row) return null;
    return rowToPriceResult(row);
}

export async function getPriceLatestByAssetIds(
    repo: StockReadsRepo,
    args: unknown,
): Promise<GetPricesByAssetIdsEntry[]> {
    const a = asObject(args);
    const rawList = readStringArray(a, 'assetIds');

    const assetIds = rawList
        .slice(0, 500)
        .map(id => id.trim())
        .filter(id => id.length > 0);

    if (assetIds.length === 0) return [];

    const rows = await repo.findPricesByAssetIds(assetIds);
    const byId = new Map(rows.map(r => [r.asset_id, r] as const));

    return assetIds.map(assetId => {
        const row = byId.get(assetId);
        if (!row) return { assetId, snapshot: null };
        return { assetId, snapshot: rowToPriceResult(row) };
    });
}
