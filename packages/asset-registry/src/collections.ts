import type { CuratedTokenListId } from './data/curated-token-lists';
import { CURATED_LIST_ORDER, getCuratedTokenAddresses, getCuratedTokenList } from './data/curated-token-lists';
import { getVariantByMint } from './registry';

export interface AssetCollection {
    id: string;
    name: string;
    description: string;
}

export function listCollections(): AssetCollection[] {
    return CURATED_LIST_ORDER.map(id => {
        const list = getCuratedTokenList(id);
        return { id: list.id, name: list.name, description: list.description };
    });
}

export function getCollection(id: CuratedTokenListId): AssetCollection | null {
    const list = getCuratedTokenList(id);
    if (!list) return null;
    return { id: list.id, name: list.name, description: list.description };
}

export function listCollectionMembers(
    id: CuratedTokenListId,
    opts: { groupBy?: 'asset' | 'mint' } = {},
): Array<{ assetId: string; mint?: string; rank: number }> {
    const groupBy = opts.groupBy ?? 'asset';
    const list = getCuratedTokenList(id);
    const mints = getCuratedTokenAddresses(list);

    if (groupBy === 'mint') {
        const out: Array<{ assetId: string; mint: string; rank: number }> = [];
        for (let i = 0; i < mints.length; i++) {
            const mint = mints[i]!;
            const match = getVariantByMint(mint);
            if (!match) continue;
            out.push({ assetId: match.asset.assetId, mint, rank: i });
        }
        return out;
    }

    const rankByAssetId = new Map<string, number>();
    for (let i = 0; i < mints.length; i++) {
        const mint = mints[i]!;
        const match = getVariantByMint(mint);
        if (!match) continue;
        const assetId = match.asset.assetId;
        if (!rankByAssetId.has(assetId)) rankByAssetId.set(assetId, i);
    }

    return Array.from(rankByAssetId.entries())
        .map(([assetId, rank]) => ({ assetId, rank }))
        .sort((a, b) => a.rank - b.rank);
}
