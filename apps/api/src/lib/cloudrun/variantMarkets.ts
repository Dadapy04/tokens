import type { GetLatestByMintsEntry } from '../../../../cloudrun-assets/src/handlers/variantMarkets';

import { getCloudRunClient } from './client';

export type GetLatestByMintsArgs = { mints: string[] };
export type GetLatestByMintsResult = GetLatestByMintsEntry[];

export async function getLatestByMints(args: GetLatestByMintsArgs): Promise<GetLatestByMintsResult> {
    return getCloudRunClient().query<GetLatestByMintsResult>('assets', 'variantMarketsGetLatestByMints', {
        ...args,
    });
}
