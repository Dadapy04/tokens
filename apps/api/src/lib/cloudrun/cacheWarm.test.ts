import { describe, expect, it } from 'bun:test';
import { Effect } from 'effect';

import {
    scheduleAssetRiskWarm,
    scheduleCacheWarm,
    scheduleCoingeckoOhlcvWarm,
    scheduleCoingeckoTickersWarm,
    scheduleCoinMetadataWarm,
    scheduleCoinPriceWarm,
    scheduleStockOhlcvWarm,
    scheduleStockPriceWarm,
} from './cacheWarm';
import { __resetCloudRunClientForTesting } from './client';

const ENV_KEYS = ['TOKENS_CACHE_WARM_SECRET'];

async function withEnv<T>(overrides: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
    const savedEnv: Record<string, string | undefined> = {};
    for (const k of ENV_KEYS) {
        savedEnv[k] = process.env[k];
        delete process.env[k];
    }
    for (const [k, v] of Object.entries(overrides)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
    __resetCloudRunClientForTesting();
    try {
        return await fn();
    } finally {
        for (const [k, v] of Object.entries(savedEnv)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
        __resetCloudRunClientForTesting();
    }
}

// Guard-path behavior: without a warm secret (and, for `scheduleCacheWarm`,
// without an x-api-key) every helper must be a no-op that never schedules
// anything (no `after()` call, no fetch). These run the returned effect to
// prove it resolves synchronously to undefined.
describe('cacheWarm helpers - no-op guards', () => {
    const noSecret = { TOKENS_CACHE_WARM_SECRET: undefined };

    it('secret-gated helpers no-op without TOKENS_CACHE_WARM_SECRET', async () => {
        await withEnv(noSecret, async () => {
            const effects = [
                scheduleCoinPriceWarm({ coinId: 'bitcoin' }),
                scheduleCoinMetadataWarm({ coinId: 'bitcoin' }),
                scheduleCoingeckoTickersWarm({ coinId: 'bitcoin' }),
                scheduleCoingeckoOhlcvWarm({ coinId: 'bitcoin', interval: '1H', days: 7 }),
                scheduleStockPriceWarm({ assetId: 'tsla' }),
                scheduleStockOhlcvWarm({ assetId: 'tsla', interval: '1H', days: 7 }),
                scheduleAssetRiskWarm({ mint: 'someMint' }),
            ];
            for (const effect of effects) {
                expect(await Effect.runPromise(effect)).toBe(undefined);
            }
        });
    });

    it('helpers no-op on empty identifiers regardless of configuration', async () => {
        await withEnv({ TOKENS_CACHE_WARM_SECRET: 's3cret' }, async () => {
            expect(await Effect.runPromise(scheduleCoinPriceWarm({ coinId: '  ' }))).toBe(undefined);
            expect(await Effect.runPromise(scheduleCacheWarm(null, { mint: '' }))).toBe(undefined);
        });
    });

    it('scheduleCacheWarm no-ops without a secret when no request/api key is available', async () => {
        await withEnv(noSecret, async () => {
            expect(await Effect.runPromise(scheduleCacheWarm(null, { mint: 'someMint' }))).toBe(undefined);

            const requestWithoutKey = new Request('https://api.test/token/someMint');
            expect(
                await Effect.runPromise(scheduleCacheWarm(requestWithoutKey, { mint: 'someMint' })),
            ).toBe(undefined);
        });
    });
});
