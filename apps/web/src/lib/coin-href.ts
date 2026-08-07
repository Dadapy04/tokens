import { looksLikeSolanaMintAddress } from '@/lib/solana-address';

export function buildCoinHref(coinId: string, solanaAddress: string | undefined): string {
    const id = coinId.trim();
    if (!id) return '/';

    if (!solanaAddress || !looksLikeSolanaMintAddress(solanaAddress)) return `/${encodeURIComponent(id)}`;

    return `/${encodeURIComponent(id)}?solana=${encodeURIComponent(solanaAddress)}`;
}
