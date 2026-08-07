export interface CoingeckoPriceRow {
    id: string;
    coin_id: string;
    price_usd: number | null;
    market_cap_usd: number | null;
    volume_24h_usd: number | null;
    price_change_24h_percent: number | null;
    provider_last_updated_at: number | null;
    last_fetched_at: number | string;
    created_at: Date;
}

export interface CoingeckoPriceSnapshot {
    coinId: string;
    priceUsd: number | null;
    marketCapUsd: number | null;
    volume24hUsd: number | null;
    priceChange24hPercent: number | null;
    providerLastUpdatedAt: number | null;
    lastFetchedAt: number;
}

export interface PricesRepo {
    findLatestByCoinId(coinId: string): Promise<CoingeckoPriceRow | null>;
}

export function rowToSnapshot(row: CoingeckoPriceRow): CoingeckoPriceSnapshot {
    return {
        coinId: row.coin_id,
        priceUsd: row.price_usd,
        marketCapUsd: row.market_cap_usd,
        volume24hUsd: row.volume_24h_usd,
        priceChange24hPercent: row.price_change_24h_percent,
        providerLastUpdatedAt: row.provider_last_updated_at,
        lastFetchedAt: Number(row.last_fetched_at),
    };
}

export class InvalidArgsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidArgsError';
    }
}

export async function getLatestByCoinId(
    repo: PricesRepo,
    args: unknown,
): Promise<CoingeckoPriceSnapshot | null> {
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    const a = args as { coinId?: unknown };
    if (typeof a.coinId !== 'string') {
        throw new InvalidArgsError('coinId must be a string');
    }
    const coinId = a.coinId.trim();
    if (!coinId) return null;
    const row = await repo.findLatestByCoinId(coinId);
    if (!row) return null;
    return rowToSnapshot(row);
}
