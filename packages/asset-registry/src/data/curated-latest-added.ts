import { CURATED_TOKEN_ADDED_AT } from './curated-token-added-at';
import type { CuratedTokenList } from './curated-token-lists';

export interface LatestAddedToken {
    address: string;
    /**
     * Unix ms of the commit that first added the token to the curated lists, or `null`
     * when the address is not in the generated map yet (i.e. it was just added and
     * `bun scripts/generate-curated-token-added-at.ts` has not been re-run).
     */
    addedAt: number | null;
}

export function getCuratedTokenAddedAt(
    address: string,
    addedAtByAddress: Record<string, number> = CURATED_TOKEN_ADDED_AT,
): number | null {
    const addedAt = addedAtByAddress[address];
    return typeof addedAt === 'number' && Number.isFinite(addedAt) ? addedAt : null;
}

/**
 * The most recently added token in a curated list, derived from git-history timestamps
 * (see `curated-token-added-at.ts`) rather than array position.
 *
 * Addresses missing from the generated map are treated as newest — a mint someone just
 * added to the list is, by definition, the latest even before the map is regenerated.
 * Ties resolve to the later array position.
 */
export function getLatestAddedToken(
    list: CuratedTokenList,
    addedAtByAddress: Record<string, number> = CURATED_TOKEN_ADDED_AT,
): LatestAddedToken | null {
    let bestAddress: string | null = null;
    let bestAddedAt = Number.NEGATIVE_INFINITY;

    for (const address of list.addresses) {
        const addedAt = getCuratedTokenAddedAt(address, addedAtByAddress) ?? Number.POSITIVE_INFINITY;
        if (addedAt >= bestAddedAt) {
            bestAddress = address;
            bestAddedAt = addedAt;
        }
    }

    if (bestAddress === null) return null;
    return {
        address: bestAddress,
        addedAt: Number.isFinite(bestAddedAt) ? bestAddedAt : null,
    };
}
