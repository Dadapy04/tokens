import { describe, expect, it } from 'bun:test';

import { buildAssetDetailResponse } from './_asset-detail-response';
import { absolutizeLocalLogoUrl } from './_asset-helpers';

describe('asset logo helpers', () => {
    it('normalizes local SVG logo URLs to PNG siblings', () => {
        const request = new Request('https://api.tokens.xyz/v1/assets/search?q=hype');

        expect(absolutizeLocalLogoUrl(request, '/logos/popular/hyperliquid.svg')).toBe(
            'https://api.tokens.xyz/logos/popular/hyperliquid.png',
        );
        expect(absolutizeLocalLogoUrl(request, 'https://api.tokens.xyz/logos/popular/hyperliquid.svg')).toBe(
            'https://api.tokens.xyz/logos/popular/hyperliquid.png',
        );
    });
});

describe('buildAssetDetailResponse', () => {
    it('includes the DB asset description when present', () => {
        const result = buildAssetDetailResponse({
            asset: {
                assetId: 'aapl',
                name: 'Apple',
                symbol: 'AAPL',
                category: 'equity',
                aliases: ['apple'],
                variants: [],
            },
            assetDescription: 'Apple Inc. is a technology company.',
            primaryVariant: null,
            token: undefined,
            tokenByMint: new Map(),
            fillQualityByMint: new Map(),
            marketMeta: undefined,
            marketMetaByMint: new Map(),
            effectiveStats: null,
            imageUrl: null,
            symbols: ['AAPL'],
            stockSymbol: 'AAPL',
            canonicalMarket: undefined,
            mintRank: new Map(),
            sanctumActiveMints: null,
            includeMint: null,
            variantsMode: '',
            includesOut: {},
            hasIncludes: false,
        });

        expect(result.asset.description).toBe('Apple Inc. is a technology company.');
        expect('resolution' in result).toBe(false);
    });

    it('carries the company market cap on a clickhouse_stock canonicalMarket', () => {
        const result = buildAssetDetailResponse({
            asset: {
                assetId: 'micron',
                name: 'Micron Technology',
                symbol: 'MU',
                category: 'equity',
                aliases: ['micron'],
                variants: [],
            },
            assetDescription: null,
            primaryVariant: null,
            token: undefined,
            tokenByMint: new Map(),
            fillQualityByMint: new Map(),
            marketMeta: undefined,
            marketMetaByMint: new Map(),
            effectiveStats: null,
            imageUrl: null,
            symbols: ['MU'],
            stockSymbol: 'MU',
            canonicalMarket: {
                source: 'clickhouse_stock',
                symbol: 'MU',
                price: 90,
                marketCap: 90 * 1_129_393_151,
                volume24hUSD: 1_000_000,
                priceChange24hPercent: 1.2,
                lastFetchedAt: 1_234_500,
                providerLastUpdatedAt: 999_999,
                asOf: 999_999,
            },
            mintRank: new Map(),
            sanctumActiveMints: null,
            includeMint: null,
            variantsMode: '',
            includesOut: {},
            hasIncludes: false,
        });

        const canonicalMarket = result.asset.canonicalMarket as { source: string; marketCap: number | null };
        expect(canonicalMarket.source).toBe('clickhouse_stock');
        expect(canonicalMarket.marketCap).toBe(90 * 1_129_393_151);
    });

    it('includes resolution metadata when present', () => {
        const result = buildAssetDetailResponse({
            asset: {
                assetId: 'usd',
                name: 'US Dollar',
                symbol: 'USD',
                category: 'stablecoin',
                aliases: ['usd'],
                variants: [],
            },
            assetDescription: null,
            primaryVariant: null,
            token: undefined,
            tokenByMint: new Map(),
            fillQualityByMint: new Map(),
            marketMeta: undefined,
            marketMetaByMint: new Map(),
            effectiveStats: null,
            imageUrl: null,
            symbols: ['USD'],
            stockSymbol: null,
            canonicalMarket: undefined,
            mintRank: new Map(),
            sanctumActiveMints: null,
            includeMint: null,
            variantsMode: '',
            includesOut: {},
            hasIncludes: false,
            resolution: {
                assetId: 'usd',
                ref: 'solana-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                resolvedBy: 'singletonMint',
                mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            },
        });

        expect(JSON.stringify(result.resolution)).toBe(
            JSON.stringify({
                assetId: 'usd',
                ref: 'solana-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                resolvedBy: 'singletonMint',
                mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            }),
        );
    });

    it('includes stockVariantTier on primary and tokenized-equity variant group rows', () => {
        const primaryVariant = {
            variantId: 'spacex:backpack',
            mint: 'BackpackSpcx1111111111111111111111111111',
            kind: 'tokenized_equity' as const,
            trustTier: 'tier2' as const,
            stockVariantTier: 'share_redeemable' as const,
            tags: ['equity'],
            label: 'Backpack Securities',
        };
        const result = buildAssetDetailResponse({
            asset: {
                assetId: 'spacex',
                name: 'SpaceX',
                symbol: 'SPCX',
                category: 'equity',
                aliases: ['spcx'],
                variants: [primaryVariant],
            },
            assetDescription: null,
            primaryVariant,
            token: undefined,
            tokenByMint: new Map(),
            fillQualityByMint: new Map(),
            marketMeta: undefined,
            marketMetaByMint: new Map(),
            effectiveStats: null,
            imageUrl: null,
            symbols: ['SPCX'],
            stockSymbol: 'SPCX',
            canonicalMarket: undefined,
            mintRank: new Map(),
            sanctumActiveMints: null,
            includeMint: null,
            variantsMode: '',
            includesOut: {},
            hasIncludes: false,
            primaryVariantStrategy: 'stock_redeemability',
        });

        expect(result.asset.primaryVariant?.stockVariantTier).toBe('share_redeemable');
        expect(result.asset.variantGroups.tokenizedEquity[0]?.stockVariantTier).toBe('share_redeemable');
        expect(result.asset.primaryVariantStrategy).toBe('stock_redeemability');
    });

    it('emits volume30dUSD when provided in stats', () => {
        const result = buildAssetDetailResponse({
            asset: {
                assetId: 'usd',
                name: 'US Dollar',
                symbol: 'USD',
                category: 'stablecoin',
                aliases: ['usd'],
                variants: [],
            },
            assetDescription: null,
            primaryVariant: null,
            token: undefined,
            tokenByMint: new Map(),
            fillQualityByMint: new Map(),
            marketMeta: undefined,
            marketMetaByMint: new Map(),
            effectiveStats: {
                price: null,
                liquidity: 1,
                volume24hUSD: 2,
                volume30dUSD: 30,
                marketCap: null,
                fdv: null,
                priceChange24hPercent: null,
                priceChange1hPercent: null,
                totalSupply: null,
                circulatingSupply: null,
            },
            imageUrl: null,
            symbols: ['USD'],
            stockSymbol: null,
            canonicalMarket: undefined,
            mintRank: new Map(),
            sanctumActiveMints: null,
            includeMint: null,
            variantsMode: '',
            includesOut: {},
            hasIncludes: false,
        });

        expect((result.asset.stats as { volume30dUSD: number }).volume30dUSD).toBe(30);
    });

    it('does not use the canonical image as a variant market logo fallback', () => {
        const result = buildAssetDetailResponse({
            asset: {
                assetId: 'uniswap',
                name: 'Uniswap',
                symbol: 'UNI',
                category: 'crypto',
                aliases: ['uniswap'],
                variants: [
                    {
                        variantId: 'uniswap:UNI_Bridge',
                        mint: 'uniHfuPhEQSrtpzXpJZDCSq53yaejKKpNhFUiKoHKHV',
                        kind: 'wrapped',
                        trustTier: 'tier3',
                        tags: ['Bridge'],
                    },
                ],
            },
            primaryVariant: null,
            token: undefined,
            tokenByMint: new Map([
                [
                    'uniHfuPhEQSrtpzXpJZDCSq53yaejKKpNhFUiKoHKHV',
                    {
                        address: 'uniHfuPhEQSrtpzXpJZDCSq53yaejKKpNhFUiKoHKHV',
                        symbol: 'UNI',
                        name: 'Uniswap',
                        decimals: 9,
                        logoURI: null,
                        liquidity: null,
                        volume24hUSD: 0,
                        price: null,
                        priceChange24hPercent: null,
                        priceChange1hPercent: null,
                        marketCap: null,
                        fdv: null,
                        holder: null,
                        totalSupply: null,
                        circulatingSupply: null,
                    },
                ],
            ]),
            fillQualityByMint: new Map(),
            marketMeta: undefined,
            marketMetaByMint: new Map(),
            effectiveStats: null,
            imageUrl: 'https://api.tokens.xyz/logos/popular/uniswap.png',
            symbols: ['UNI'],
            stockSymbol: null,
            canonicalMarket: undefined,
            mintRank: new Map(),
            sanctumActiveMints: null,
            includeMint: null,
            variantsMode: '',
            includesOut: {},
            hasIncludes: false,
        });

        expect(result.asset.imageUrl).toBe('https://api.tokens.xyz/logos/popular/uniswap.png');
        expect(result.asset.variantGroups.spot[0]?.market?.logoURI).toBe(null);
    });
});
