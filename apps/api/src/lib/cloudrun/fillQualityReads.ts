import type { GetLatestByMintsEntry } from '../../../../cloudrun-assets/src/handlers/fillQualityReads';

import { getCloudRunClient } from './client';

export type VariantFillQualityGetLatestByMintsArgs = { mints: string[] };
export type VariantFillQualityGetLatestByMintsResult = GetLatestByMintsEntry[];

export async function variantFillQualityGetLatestByMints(
    args: VariantFillQualityGetLatestByMintsArgs,
): Promise<VariantFillQualityGetLatestByMintsResult> {
    return getCloudRunClient().query<VariantFillQualityGetLatestByMintsResult>(
        'assets',
        'variantFillQualityGetLatestByMints',
        { ...args },
    );
}
