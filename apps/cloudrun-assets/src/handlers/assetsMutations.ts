import {
    IdentityRequiredError,
    InvalidArgsError,
    type AssetsRepo,
    type CallerIdentity,
} from './assets';

export interface SetAssetDescriptionResult {
    updated: boolean;
}

export async function setAssetDescriptionByAssetId(
    repo: AssetsRepo,
    args: unknown,
    identity: CallerIdentity | null,
): Promise<SetAssetDescriptionResult> {
    if (!identity) {
        throw new IdentityRequiredError();
    }
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    const a = args as { assetId?: unknown; description?: unknown };
    if (typeof a.assetId !== 'string') {
        throw new InvalidArgsError('assetId must be a string');
    }
    if (a.description !== null && typeof a.description !== 'string') {
        throw new InvalidArgsError('description must be a string or null');
    }
    const assetId = a.assetId.trim();
    if (!assetId) return { updated: false };

    const nextDescription =
        typeof a.description === 'string' ? (a.description.trim() || null) : null;

    const updated = await repo.setDescriptionByAssetId(assetId, nextDescription, new Date());
    if (updated) {
        console.log(JSON.stringify({
            event: 'mutation',
            mutation: 'setAssetDescriptionByAssetId',
            assetId,
            clerkUserId: identity.clerkUserId,
            projectId: identity.projectId ?? null,
        }));
    }
    return { updated };
}
