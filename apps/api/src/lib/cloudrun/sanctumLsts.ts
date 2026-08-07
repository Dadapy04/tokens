import type {
    SanctumLstResult,
    SanctumResolveRefResult,
} from '../../../../cloudrun-assets/src/handlers/sanctumLsts';

import { getCloudRunClient } from './client';

export type ListActiveArgs = { limit?: number };
export type ListActiveResult = SanctumLstResult[];

export async function listActive(args: ListActiveArgs = {}): Promise<ListActiveResult> {
    return getCloudRunClient().query<ListActiveResult>('assets', 'sanctumListActive', { ...args });
}

export type ResolveRefArgs = { ref: string };
export type ResolveRefResult = SanctumResolveRefResult | null;

export async function resolveRef(args: ResolveRefArgs): Promise<ResolveRefResult> {
    return getCloudRunClient().query<ResolveRefResult>('assets', 'sanctumResolveRef', { ...args });
}
