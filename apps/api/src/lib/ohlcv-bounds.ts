import { Effect } from 'effect';

import { BadRequestError } from '@tokens/effect';
import type { TimeInterval } from '@/lib/birdeye';

export function intervalToSeconds(interval: TimeInterval): number {
    switch (interval) {
        case '1m':
            return 60;
        case '5m':
            return 5 * 60;
        case '15m':
            return 15 * 60;
        case '1H':
            return 60 * 60;
        case '4H':
            return 4 * 60 * 60;
        case '1D':
            return 24 * 60 * 60;
        case '1W':
            return 7 * 24 * 60 * 60;
    }
}

/** No tracked market predates 2010 — anything earlier is abuse or a client bug. */
const MIN_FROM_SECONDS = 1_262_304_000; // 2010-01-01T00:00:00Z

/** Allow a little clock skew, but don't accept far-future `to` values. */
const MAX_FUTURE_SKEW_SECONDS = 300;

/**
 * Hard cap on candle slots per request. Without it, `from=0&interval=1m`
 * implies ~28M candle slots. 10k still allows ~7 days of 1m candles.
 */
export const MAX_OHLCV_CANDLES = 10_000;

/**
 * Validate and clamp an OHLCV time range. Returns the (possibly clamped)
 * `{ from, to }` to use, or fails with BadRequestError.
 *
 * `fieldPrefix` adjusts error messages for routes that namespace the params
 * (e.g. `ohlcvFrom`/`ohlcvTo` on the asset detail route).
 */
export function validateOhlcvRange(params: {
    from: number;
    to: number;
    interval: TimeInterval;
    fieldPrefix?: string;
}): Effect.Effect<{ from: number; to: number }, BadRequestError, never> {
    return Effect.suspend(() => {
        const prefix = params.fieldPrefix ?? '';
        const fromField = prefix ? `${prefix}From` : 'from';
        const toField = prefix ? `${prefix}To` : 'to';

        if (params.from > params.to) {
            return Effect.fail(new BadRequestError({ message: `\`${fromField}\` must be <= \`${toField}\`` }));
        }
        if (params.from < MIN_FROM_SECONDS) {
            return Effect.fail(
                new BadRequestError({
                    message: `\`${fromField}\` is too far in the past`,
                    details: { minFrom: MIN_FROM_SECONDS },
                }),
            );
        }

        const now = Math.floor(Date.now() / 1000);
        const to = Math.min(params.to, now + MAX_FUTURE_SKEW_SECONDS);
        if (params.from > to) {
            return Effect.fail(new BadRequestError({ message: `\`${fromField}\` must not be in the future` }));
        }

        const candles = Math.floor((to - params.from) / intervalToSeconds(params.interval)) + 1;
        if (candles > MAX_OHLCV_CANDLES) {
            return Effect.fail(
                new BadRequestError({
                    message: `Requested range is too large: max ${MAX_OHLCV_CANDLES} candles per request`,
                    details: {
                        intervalSeconds: intervalToSeconds(params.interval),
                        maxCandles: MAX_OHLCV_CANDLES,
                        requestedCandles: candles,
                    },
                }),
            );
        }

        return Effect.succeed({ from: params.from, to });
    });
}
