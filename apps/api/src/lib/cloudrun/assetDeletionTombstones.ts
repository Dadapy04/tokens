import { getCloudRunClient } from './client';

export type ListDeletedRefsArgs = { refs: string[] };
export type ListDeletedRefsResult = string[];

export async function listDeletedRefs(args: ListDeletedRefsArgs): Promise<ListDeletedRefsResult> {
    return getCloudRunClient().query<ListDeletedRefsResult>('assets', 'listDeletedRefs', { ...args });
}
