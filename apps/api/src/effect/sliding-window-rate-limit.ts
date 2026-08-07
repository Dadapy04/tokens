import type { RedisClient } from '@/lib/redis';
import { SLIDING_WINDOW_LIMIT_SCRIPT } from '@/lib/redis/lua';

/**
 * Sliding-window rate-limit helper.
 *
 * This is a thin, self-contained port of the relevant slice of
 * `@upstash/ratelimit`'s `Ratelimit.slidingWindow(...)` limiter that goes
 * through our internal `RedisClient` interface instead of `@upstash/redis`
 * directly. The Lua script in `lua/index.ts` is byte-identical to the
 * library's `slidingWindowLimitScript`, so the on-Redis state and
 * accounting math are equivalent.
 *
 * Differences vs. the library (all intentional):
 * - No analytics / multi-region / cache / deny-list. This pathway is
 *   single-region with no metrics emission.
 * - No `pending` Promise. The library uses it for background analytics
 *   writes; we have none, so callers don't need to drain it.
 * - Timeout/fail-open is handled by the caller (see `next-route.ts`,
 *   which logs `logRateLimitDegraded` on any non-RateLimited failure).
 */

export interface SlidingWindowLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

const PREFIX = 'ratelimit';

/**
 * Run one sliding-window limit check via EVALSHA, falling back to EVAL on
 * NOSCRIPT (cold cache / new replica). Keys / args match the original
 * Upstash contract: KEYS = [currentKey, previousKey, dynamicLimitKey],
 * ARGV = [tokens, nowMs, windowMs, incrementBy].
 */
export async function slidingWindowLimit(params: {
    redis: RedisClient;
    identifier: string;
    tokens: number;
    windowSeconds: number;
    incrementBy?: number;
    now?: number;
}): Promise<SlidingWindowLimitResult> {
    const { redis, identifier, tokens, windowSeconds } = params;
    const incrementBy = params.incrementBy ?? 1;
    const now = params.now ?? Date.now();

    const windowMs = windowSeconds * 1000;
    const currentWindow = Math.floor(now / windowMs);
    const previousWindow = currentWindow - 1;

    const base = `${PREFIX}:${identifier}`;
    const currentKey = `${base}:${currentWindow}`;
    const previousKey = `${base}:${previousWindow}`;
    // We don't use dynamic limits; pass an empty string per the script's
    // contract (the Lua treats "" as "no dynamic limit configured").
    const dynamicLimitKey = '';

    const keys = [currentKey, previousKey, dynamicLimitKey];
    const args = [tokens, now, windowMs, incrementBy];

    const result = await evalWithFallback<[number, number]>(redis, keys, args);
    const remainingTokens = Number(result[0]);
    const effectiveLimit = Number(result[1]);
    const success = remainingTokens >= 0;
    const reset = (currentWindow + 1) * windowMs;

    return {
        success,
        limit: effectiveLimit,
        remaining: Math.max(0, remainingTokens),
        reset,
    };
}

async function evalWithFallback<T>(
    redis: RedisClient,
    keys: string[],
    args: Array<string | number>,
): Promise<T> {
    try {
        return await redis.evalsha<T>(SLIDING_WINDOW_LIMIT_SCRIPT.sha1, keys, args);
    } catch (err) {
        if (isNoScriptError(err)) {
            return await redis.eval<T>(SLIDING_WINDOW_LIMIT_SCRIPT.script, keys, args);
        }
        throw err;
    }
}

function isNoScriptError(err: unknown): boolean {
    const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
    return message.includes('NOSCRIPT');
}
