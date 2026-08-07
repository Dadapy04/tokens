export interface AssetLookupResult {
    assetId: string;
    name?: string;
    symbol?: string;
}

export interface AssetLookupResponse {
    query: string;
    results: AssetLookupResult[];
}

export interface VariantMarketSnapshot {
    price: number | null;
    liquidity: number | null;
    volume24hUSD?: number | null;
    marketCap?: number | null;
    priceChange24hPercent: number | null;
    decimals?: number | null;
    logoURI?: string | null;
    symbol?: string;
    name?: string;
}

export interface AssetVariantResult {
    mint: string;
    kind?: string;
    symbol?: string;
    name?: string;
    label?: string;
    market?: VariantMarketSnapshot | null;
}

export interface AssetVariantsResponse {
    assetId: string;
    variants: AssetVariantResult[];
}

export interface AssetVariantsSnapshot {
    query: string;
    assetId: string;
    requestPath: string;
    status: number;
    data: AssetVariantsResponse;
}

export interface VariantCardResult {
    mint: string;
    name: string;
    symbol: string;
    kind?: string;
    stats: {
        price: number | null;
        priceChange24hPercent: number | null;
    };
    market?: {
        logoURI?: string | null;
        liquidity?: number | null;
    } | null;
}

export type Mode = 'auto' | 'user';
export type Phase = 'idle' | 'typing' | 'fetching' | 'settled' | 'deleting';

export interface UserResult {
    assetId: string;
    requestPath: string;
    data: AssetVariantsResponse;
    status: number;
}
