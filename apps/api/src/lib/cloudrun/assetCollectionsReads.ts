import { getCloudRunClient } from './client';

export type AssetCollectionsGetMembersArgs = { slug: string; limit?: number };
export type AssetCollectionsGetMembersResult = string[];

export async function assetCollectionsGetMembers(
    args: AssetCollectionsGetMembersArgs,
): Promise<AssetCollectionsGetMembersResult> {
    return getCloudRunClient().query<AssetCollectionsGetMembersResult>(
        'assets',
        'assetCollectionsGetMembers',
        { ...args },
    );
}
