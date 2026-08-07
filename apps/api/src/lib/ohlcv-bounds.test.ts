import { describe, expect, test } from 'bun:test';
import { Effect, Exit } from 'effect';

import { MAX_OHLCV_CANDLES, validateOhlcvRange } from './ohlcv-bounds';

function run(params: Parameters<typeof validateOhlcvRange>[0]) {
    return Effect.runSyncExit(validateOhlcvRange(params));
}

describe('validateOhlcvRange', () => {
    const now = Math.floor(Date.now() / 1000);

    test('accepts a normal 7d hourly range', () => {
        const exit = run({ from: now - 7 * 24 * 3600, to: now, interval: '1H' });
        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
            expect(exit.value.from).toBe(now - 7 * 24 * 3600);
            expect(exit.value.to).toBe(now);
        }
    });

    test('rejects from > to', () => {
        const exit = run({ from: now, to: now - 100, interval: '1H' });
        expect(Exit.isFailure(exit)).toBe(true);
    });

    test('rejects pre-2010 from (e.g. from=0)', () => {
        const exit = run({ from: 0, to: now, interval: '1m' });
        expect(Exit.isFailure(exit)).toBe(true);
    });

    test('clamps far-future to', () => {
        const exit = run({ from: now - 3600, to: now + 10 * 24 * 3600, interval: '1H' });
        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
            expect(exit.value.to).toBeLessThanOrEqual(now + 301);
        }
    });

    test('rejects ranges exceeding the candle cap', () => {
        const exit = run({ from: now - 30 * 24 * 3600, to: now, interval: '1m' });
        expect(Exit.isFailure(exit)).toBe(true);
    });

    test('allows ~7 days of 1m candles (within cap)', () => {
        const exit = run({ from: now - 6 * 24 * 3600, to: now, interval: '1m' });
        expect(Exit.isSuccess(exit)).toBe(true);
        expect(6 * 24 * 60).toBeLessThanOrEqual(MAX_OHLCV_CANDLES);
    });
});
