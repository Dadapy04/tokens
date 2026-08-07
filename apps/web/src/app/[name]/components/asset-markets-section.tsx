import { Suspense } from 'react';

import { fetchApiAppJsonOrNull } from '@/lib/api-app';
import { AssetMarketsTable } from './asset-markets-table';
import type { TokenMarket } from '@/lib/birdeye';

interface AssetMarketsSectionProps {
    assetId: string;
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string;
}

interface AssetIncludeOk<T> {
    ok: true;
    data: T;
}

interface AssetIncludeError {
    ok: false;
    reason: string;
    message: string;
}

type AssetIncludeResult<T> = AssetIncludeOk<T> | AssetIncludeError;

interface AssetMarketsInclude {
    markets: TokenMarket[];
    total: number | undefined;
    offset: number;
    limit: number;
}

interface AssetMarketsApiResponse {
    includes?: {
        markets?: AssetIncludeResult<AssetMarketsInclude>;
    };
}

export function AssetMarketsSection({ assetId, tokenMint, tokenSymbol, tokenName }: AssetMarketsSectionProps) {
    return (
        <div>
            <h3 className="text-title-md text-text-extra-high mb-6 mt-12 text-balance">Markets</h3>
            <Suspense fallback={<AssetMarketsTableSkeleton />}>
                <AssetMarketsTableLoader
                    assetId={assetId}
                    tokenMint={tokenMint}
                    tokenSymbol={tokenSymbol}
                    tokenName={tokenName}
                />
            </Suspense>
        </div>
    );
}

async function AssetMarketsTableLoader({
    assetId,
    tokenMint,
    tokenSymbol,
    tokenName,
}: {
    assetId: string;
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string;
}) {
    const params = new URLSearchParams({
        include: 'markets',
        marketsOffset: '0',
        marketsLimit: '10',
    });
    params.set('mint', tokenMint);

    const result = await fetchApiAppJsonOrNull<AssetMarketsApiResponse>(
        `/api/v1/assets/${encodeURIComponent(assetId)}?${params.toString()}`,
        {
            next: { revalidate: 60 },
        },
    );

    const include = result?.includes?.markets;
    if (!include) {
        return (
            <div className="bg-white rounded-[32px] border border-border-light shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-12 text-center">
                <p className="text-text-low text-[16px]">Markets unavailable</p>
                <p className="text-text-extra-low text-[14px] mt-2">Couldn’t load markets for this asset right now.</p>
            </div>
        );
    }

    if (!include.ok) {
        return (
            <div className="bg-white rounded-[32px] border border-border-light shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-12 text-center">
                <p className="text-text-low text-[16px]">Markets unavailable</p>
                <p className="text-text-extra-low text-[14px] mt-2 text-pretty">{include.message}</p>
            </div>
        );
    }

    if (include.data.markets.length === 0) {
        return (
            <div className="bg-white rounded-[32px] border border-border-light shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-12 text-center">
                <p className="text-text-low text-[16px]">No markets found</p>
                <p className="text-text-extra-low text-[14px] mt-2">
                    Birdeye didn’t return any markets for this asset.
                </p>
            </div>
        );
    }

    return (
        <AssetMarketsTable
            assetId={assetId}
            tokenMint={tokenMint}
            tokenSymbol={tokenSymbol}
            tokenName={tokenName}
            initialMarkets={include.data.markets}
            initialTotal={include.data.total}
        />
    );
}

function AssetMarketsTableSkeleton() {
    return (
        <div className="bg-white rounded-[32px] border border-border-medium shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-extra-light bg-gray-50/80">
                            <th className="py-3 bg-gray-50/80 border-b border-border-light pl-8 pr-4">
                                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                            </th>
                            <th className="py-3 bg-gray-50/80 border-b border-border-light px-6">
                                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse ml-auto" />
                            </th>
                            <th className="py-3 bg-gray-50/80 border-b border-border-light px-6">
                                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse ml-auto" />
                            </th>
                            <th className="py-3 bg-gray-50/80 border-b border-border-light px-6">
                                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
                            </th>
                            <th className="py-3 bg-gray-50/80 border-b border-border-light pl-6 pr-8">
                                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-extra-light">
                        {Array.from({ length: 6 }, (_, index) => (
                            <tr key={index}>
                                <td className="py-4 pl-8 pr-4">
                                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mt-2" />
                                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mt-2" />
                                </td>
                                <td className="py-4 px-6">
                                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse ml-auto" />
                                </td>
                                <td className="py-4 px-6">
                                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse ml-auto" />
                                </td>
                                <td className="py-4 px-6">
                                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
                                </td>
                                <td className="py-4 pl-6 pr-8">
                                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
