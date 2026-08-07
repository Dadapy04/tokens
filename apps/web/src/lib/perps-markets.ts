export type PerpsMarketProviderId = 'flashtrade' | 'phoenixtrade';

export interface PerpsMarket {
    providerId: PerpsMarketProviderId;
    symbol: string;
    displaySymbol: string;
    quoteSymbol: string;
    href: string;
    lookupKeys: string[];
    status?: string;
}

export interface PerpsProviderStatus {
    ok: boolean;
    count: number;
    error?: string;
}

export interface PerpsMarketsResponse {
    markets: PerpsMarket[];
    providerStatuses: Record<PerpsMarketProviderId, PerpsProviderStatus>;
    updatedAt: string;
}
