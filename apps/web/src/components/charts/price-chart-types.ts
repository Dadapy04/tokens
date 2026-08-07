import type { TimeInterval } from '@/lib/birdeye';

export interface PriceCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number | null;
}

export interface PriceChartShareContext {
    address?: string;
    assetId?: string;
    mint?: string;
    coinId?: string;
}

export interface TokenPriceChartCoreProps {
    candles: PriceCandle[];
    isLoading: boolean;
    isPending?: boolean;
    error: string | null;
    symbol: string;
    tokenName?: string;
    logoURI?: string;
    currentPrice?: number;
    priceChange24h?: number;
    timeRangeDays: number;
    onTimeRangeChange: (days: number) => void;
    interval?: TimeInterval;
    onIntervalChange?: (interval: TimeInterval) => void;
    showIntervalSelector: boolean;
    realtimePoint?: { time: number; value: number } | null;
    variant: 'card' | 'inline-asset';
    shareContext: PriceChartShareContext;
}
