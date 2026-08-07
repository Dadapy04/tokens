import { notFound, redirect } from 'next/navigation';

import { getVariantByMint } from '@tokens/asset-registry';
import { fetchApiAppJsonOrNull } from '@/lib/api-app';

interface TokenPageProps {
    params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: TokenPageProps) {
    const { address } = await params;

    const match = getVariantByMint(address);
    if (match) {
        const displayName =
            (match.variant.name ?? match.asset.name ?? match.asset.assetId).trim() || match.asset.assetId;
        const symbol = (match.variant.symbol ?? match.asset.symbol ?? '').trim();
        return { title: symbol ? `${displayName} (${symbol}) | Tokens` : `${displayName} | Tokens` };
    }

    const resolved = await fetchApiAppJsonOrNull<{
        asset: { assetId: string; name?: string | null; symbol?: string | null };
        variant: { mint: string; label?: string; name?: string; symbol?: string } | null;
    }>(`/api/v1/assets/resolve?mint=${encodeURIComponent(address)}`, { next: { revalidate: 60 } });
    if (!resolved?.asset?.assetId) return { title: 'Token Not Found' };

    const displayName =
        (resolved.variant?.name ?? resolved.variant?.label ?? resolved.asset.name ?? resolved.asset.assetId).trim() ||
        resolved.asset.assetId;
    const symbol = (resolved.variant?.symbol ?? resolved.asset.symbol ?? '').trim();

    return { title: symbol ? `${displayName} (${symbol}) | Tokens` : `${displayName} | Tokens` };
}

export default async function TokenPage({ params }: TokenPageProps) {
    const { address } = await params;

    const match = getVariantByMint(address);
    if (match) {
        if (match.asset.category === 'equity' && match.asset.variants.length === 1) {
            redirect(`/${encodeURIComponent(match.asset.assetId)}`);
        }

        const routeName = match.asset.coingeckoId ?? match.asset.assetId;
        redirect(`/${encodeURIComponent(routeName)}?solana=${encodeURIComponent(address)}`);
    }

    const resolved = await fetchApiAppJsonOrNull<{
        assetId: string;
        asset: { assetId: string; category?: string | null };
    }>(`/api/v1/assets/resolve?mint=${encodeURIComponent(address)}`, { next: { revalidate: 60 } });
    if (!resolved?.asset?.assetId) notFound();

    const routeName = resolved.assetId;
    redirect(`/${encodeURIComponent(routeName)}?solana=${encodeURIComponent(address)}`);
}
