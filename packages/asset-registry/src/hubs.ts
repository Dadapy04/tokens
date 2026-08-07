import type { AssetVariant, CanonicalAsset } from './types';
import { getAsset, getVariantByMint, listAssets } from './registry';

export interface HubMatch {
    hub: CanonicalAsset;
    variant: AssetVariant;
}

/** @deprecated Use getVariantByMint from registry or getVariantHubByMint from variant-hubs. */
export function getHubByMint(mint: string): HubMatch | null {
    const match = getVariantByMint(mint);
    if (!match) return null;
    return { hub: match.asset, variant: match.variant };
}

/** @deprecated Use getAsset from registry. */
export function getHub(assetId: string): CanonicalAsset | null {
    return getAsset(assetId);
}

/** @deprecated Use listAssets from registry. */
export function listHubs(): CanonicalAsset[] {
    return listAssets();
}
