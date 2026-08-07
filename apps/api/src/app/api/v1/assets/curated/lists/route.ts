import { Effect } from 'effect';

import { route } from '@/effect/next-route';
import { getVariantByMint } from '@tokens/asset-registry';
import { getCuratedTokenAddresses, getCuratedTokenList, getLatestAddedToken } from '@tokens/asset-registry/compat';

const HOME_CATEGORY_IDS = ['majors', 'currencies', 'rwas', 'etfs', 'metals', 'stocks'] as const;
type HomeCategoryId = (typeof HOME_CATEGORY_IDS)[number];

function looksLikeSolanaMintAddress(value: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function mintToSingletonAssetId(mint: string): string {
    return `solana-${mint.trim()}`;
}

function fallbackNameForId(id: HomeCategoryId): string {
    switch (id) {
        case 'majors':
            return 'Majors';
        case 'currencies':
            return 'Currencies';
        case 'rwas':
            return 'RWAs';
        case 'etfs':
            return 'ETFs';
        case 'metals':
            return 'Metals';
        case 'stocks':
            return 'Stocks';
        default:
            return id;
    }
}

export const GET = route(() =>
    Effect.sync(() =>
        HOME_CATEGORY_IDS.map(id => {
            const list = getCuratedTokenList(id);
            const mints = getCuratedTokenAddresses(list);
            const assetIds = Array.from(
                new Set(
                    mints.map(mint => {
                        const match = getVariantByMint(mint);
                        if (match) return match.asset.assetId;
                        return looksLikeSolanaMintAddress(mint) ? mintToSingletonAssetId(mint) : mint;
                    }),
                ),
            );
            // Derived from git-history added-at timestamps (not array position), so the
            // "Latest Added" highlight is literally the most recently added token.
            const latestAdded = getLatestAddedToken(list);
            const rawLastMint = latestAdded?.address ?? null;
            const rawLastAssetId = rawLastMint
                ? (getVariantByMint(rawLastMint)?.asset.assetId ??
                  (looksLikeSolanaMintAddress(rawLastMint) ? mintToSingletonAssetId(rawLastMint) : rawLastMint))
                : null;
            const lastAddedAssetId = rawLastAssetId && rawLastAssetId.trim() ? rawLastAssetId : null;
            const name = list.name.trim() || fallbackNameForId(id);
            return {
                id,
                name,
                count: assetIds.length,
                lastAddedAssetId,
                lastAddedAt: latestAdded?.addedAt ?? null,
            };
        }),
    ),
);
