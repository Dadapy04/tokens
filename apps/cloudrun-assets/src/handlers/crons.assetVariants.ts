import {
    SOLANA_DEFAULT_VARIANTS_VIEW_KEY,
    buildSolanaVariantsForApi,
    type AssetVariantsRepo,
} from './assetVariants';
import type { CronResult } from './crons';

export interface AssetVariantsCronDeps {
    assetVariantsRepo: AssetVariantsRepo;
    now: () => number;
}

export type AssetVariantsJobHandler = (
    deps: AssetVariantsCronDeps,
    args: unknown,
) => Promise<CronResult>;

export async function refreshSolanaDefaultVariantsView(
    deps: AssetVariantsCronDeps,
    args: unknown,
): Promise<CronResult> {
    void args;
    const start = deps.now();
    const result = await buildSolanaVariantsForApi(deps.assetVariantsRepo, {});
    const updatedAt = deps.now();
    const variantsJson = JSON.stringify(result.variants);
    await deps.assetVariantsRepo.upsertSolanaDefaultVariantsView({
        variantsJson,
        updatedAt,
    });
    return {
        ok: true,
        processed: result.variants.length,
        durationMs: deps.now() - start,
        viewKey: SOLANA_DEFAULT_VARIANTS_VIEW_KEY,
        updatedAt,
    };
}

export const assetVariantsJobs: Record<string, AssetVariantsJobHandler> = {
    'refresh-solana-default-variants-view': refreshSolanaDefaultVariantsView,
};
