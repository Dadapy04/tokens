import { InvalidArgsError } from './assets';

export type TimeInterval = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

const TIME_INTERVALS: readonly TimeInterval[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

const MAX_CANDLES = 12_000;

export interface OhlcvCandleRow {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface OhlcvReadsRepo {
    listByAddressAndInterval(
        address: string,
        interval: TimeInterval,
        from: number,
        to: number,
        limit: number,
    ): Promise<OhlcvCandleRow[]>;
    getBoundsByAddressAndInterval(
        address: string,
        interval: TimeInterval,
    ): Promise<{ minTime: number | null; maxTime: number | null }>;
    listByAssetIdAndInterval(
        assetId: string,
        interval: TimeInterval,
        from: number,
        to: number,
        limit: number,
    ): Promise<OhlcvCandleRow[]>;
}

export interface OhlcvCandleResult {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface OhlcvBoundsResult {
    minTime: number | null;
    maxTime: number | null;
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

function readInterval(args: Record<string, unknown>): TimeInterval {
    const value = args.interval;
    if (typeof value !== 'string' || !(TIME_INTERVALS as readonly string[]).includes(value)) {
        throw new InvalidArgsError('interval must be one of 1m,5m,15m,1H,4H,1D,1W');
    }
    return value as TimeInterval;
}

function readOptionalNumber(args: Record<string, unknown>, key: string): number | undefined {
    const value = args[key];
    if (value === undefined) return undefined;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new InvalidArgsError(`${key} must be a finite number`);
    }
    return value;
}

function candleRowToResult(row: OhlcvCandleRow): OhlcvCandleResult {
    return {
        time: row.time,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
    };
}

export async function listOhlcv(
    repo: OhlcvReadsRepo,
    args: unknown,
): Promise<OhlcvCandleResult[]> {
    const a = asObject(args);
    const address = readString(a, 'address');
    const interval = readInterval(a);
    const from = readOptionalNumber(a, 'from') ?? 0;
    const to = readOptionalNumber(a, 'to') ?? Number.MAX_SAFE_INTEGER;
    const limitArg = readOptionalNumber(a, 'limit');
    const limit = Math.min(MAX_CANDLES, Math.max(1, limitArg ?? MAX_CANDLES));

    const rows = await repo.listByAddressAndInterval(address, interval, from, to, limit);
    return rows.map(candleRowToResult);
}

export async function getOhlcvBounds(
    repo: OhlcvReadsRepo,
    args: unknown,
): Promise<OhlcvBoundsResult> {
    const a = asObject(args);
    const address = readString(a, 'address');
    const interval = readInterval(a);
    return repo.getBoundsByAddressAndInterval(address, interval);
}

export async function listStockOhlcv(
    repo: OhlcvReadsRepo,
    args: unknown,
): Promise<OhlcvCandleResult[]> {
    const a = asObject(args);
    const assetIdRaw = readString(a, 'assetId');
    const interval = readInterval(a);
    const assetId = assetIdRaw.trim();
    if (!assetId) return [];

    const from = readOptionalNumber(a, 'from') ?? 0;
    const to = readOptionalNumber(a, 'to') ?? Number.MAX_SAFE_INTEGER;
    const limitArg = readOptionalNumber(a, 'limit');
    const limit = Math.min(MAX_CANDLES, Math.max(1, limitArg ?? MAX_CANDLES));

    const rows = await repo.listByAssetIdAndInterval(assetId, interval, from, to, limit);
    return rows.map(candleRowToResult);
}
