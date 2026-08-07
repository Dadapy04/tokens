import { CURATED_TOKEN_LISTS } from '../packages/asset-registry/src/data/curated-token-lists.ts';
import { getVariantByMint, listAssets } from '../packages/asset-registry/src/registry.ts';

const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// If we ever intentionally keep mint-based assetIds, add them here.
const ALLOWED_MINT_LIKE_ASSET_IDS = new Set([]);

function normalizeListEntries() {
    const entries = [];
    for (const list of Object.values(CURATED_TOKEN_LISTS)) {
        if (!list || typeof list !== 'object') continue;
        const listId = String(list.id ?? '');
        const addresses = Array.isArray(list.addresses) ? list.addresses : [];
        for (const mint of addresses) entries.push({ listId, mint: String(mint) });
    }
    return entries;
}

function main() {
    const errors = [];

    const entries = normalizeListEntries();
    const uniqueMints = new Set(entries.map(e => e.mint));

    for (const { listId, mint } of entries) {
        const match = getVariantByMint(mint);
        if (!match) {
            errors.push(`[missing-variant] list=${listId} mint=${mint}`);
            continue;
        }

        const assetId = match.asset.assetId;
        if (MINT_RE.test(assetId) && !ALLOWED_MINT_LIKE_ASSET_IDS.has(assetId)) {
            errors.push(`[mint-like-assetId] list=${listId} mint=${mint} -> assetId=${assetId}`);
        }
    }

    const mintLikeAssets = listAssets().filter(
        a => MINT_RE.test(a.assetId) && !ALLOWED_MINT_LIKE_ASSET_IDS.has(a.assetId),
    );

    if (mintLikeAssets.length > 0) {
        errors.push(
            `[mint-like-assets] count=${mintLikeAssets.length} ids=${mintLikeAssets
                .slice(0, 25)
                .map(a => a.assetId)
                .join(', ')}`,
        );
    }

    if (errors.length > 0) {
        console.error(
            ['Asset registry validation failed', `lists=${entries.length}`, `uniqueMints=${uniqueMints.size}`].join(' | '),
        );
        for (const e of errors.slice(0, 200)) console.error(`- ${e}`);
        if (errors.length > 200) console.error(`...and ${errors.length - 200} more`);
        process.exit(1);
    }

    console.log(
        ['Asset registry validation OK', `lists=${entries.length}`, `uniqueMints=${uniqueMints.size}`].join(' | '),
    );
}

main();

