import { Effect } from 'effect';

import { route } from '@/effect/next-route';
import { loadAssetWithSelectedVariant } from '../../_asset-route-loader';
import { loadAssetRisk, toRiskDetails } from '../../_risk-loader';

export const GET = route(
    (request: Request, ctx: { params: Promise<{ assetId: string }> }) =>
        Effect.gen(function* () {
            const { assetId: rawAssetId } = yield* Effect.tryPromise(() => ctx.params);
            const loaded = yield* loadAssetWithSelectedVariant({ request, rawAssetId });
            return toRiskDetails(yield* loadAssetRisk(loaded, { operation: 'details' }));
        }),
    { platform: { requiredScopes: ['assets:read'] } },
);
