import type {
    OhlcvCandleResult,
    OhlcvBoundsResult as HandlerOhlcvBoundsResult,
} from '../../../../cloudrun-assets/src/handlers/ohlcvReads';

import { sanitizeOhlcvWicks } from '../ohlcv-sanitize';
import { getCloudRunClient } from './client';

export type OhlcvListArgs = {
    address: string;
    interval: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
    from?: number;
    to?: number;
    limit?: number;
};
export type OhlcvListResult = OhlcvCandleResult[];

export async function ohlcvList(args: OhlcvListArgs): Promise<OhlcvListResult> {
    const candles = await getCloudRunClient().query<OhlcvListResult>('assets', 'ohlcvList', { ...args });
    // On-chain candles aggregate raw swaps across all pools; dust trades in
    // illiquid pools poison high/low (see ohlcv-sanitize.ts).
    return sanitizeOhlcvWicks(candles);
}

export type OhlcvBoundsArgs = {
    address: string;
    interval: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
};
export type OhlcvBoundsResult = HandlerOhlcvBoundsResult;

export async function ohlcvBounds(args: OhlcvBoundsArgs): Promise<OhlcvBoundsResult> {
    return getCloudRunClient().query<OhlcvBoundsResult>('assets', 'ohlcvBounds', { ...args });
}

export type StockOhlcvListArgs = {
    assetId: string;
    interval: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
    from?: number;
    to?: number;
    limit?: number;
};
export type StockOhlcvListResult = OhlcvCandleResult[];

export async function stockOhlcvList(args: StockOhlcvListArgs): Promise<StockOhlcvListResult> {
    return getCloudRunClient().query<StockOhlcvListResult>('assets', 'stockOhlcvList', { ...args });
}
