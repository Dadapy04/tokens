export interface Token {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    liquidity: number;
    volume24hUSD: number;
    price: number;
    priceChange24hPercent: number;
    priceChange1hPercent?: number;
    marketCap: number;
}

export interface MarketStats {
    volume24h: number;
    totalTvl: number;
    totalMarketCap: number;
    allTimeVolume: number;
}
