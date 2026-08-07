import { normalizeCuratedTokenListId } from '@tokens/asset-registry/compat';

import { InvalidArgsError } from './assets';

export interface AssetCollectionMemberRow {
    asset_id: string;
}

export interface AssetCollectionsReadsRepo {
    listMembersBySlug(slug: string, limit: number): Promise<AssetCollectionMemberRow[]>;
}

export async function getMembers(
    repo: AssetCollectionsReadsRepo,
    args: unknown,
): Promise<string[]> {
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    const a = args as { slug?: unknown; limit?: unknown };
    if (typeof a.slug !== 'string') {
        throw new InvalidArgsError('slug must be a string');
    }
    if (a.limit !== undefined && typeof a.limit !== 'number') {
        throw new InvalidArgsError('limit must be a number when present');
    }
    const rawSlug = a.slug.trim();
    if (!rawSlug) return [];
    const slug = normalizeCuratedTokenListId(rawSlug) ?? rawSlug;
    const limit = Math.min(Math.max(typeof a.limit === 'number' ? a.limit : 500, 1), 2000);
    const rows = await repo.listMembersBySlug(slug, limit);
    return rows.map(r => r.asset_id);
}
