import { createHash } from 'node:crypto';
import { describe, expect, it } from 'bun:test';

import { SLIDING_WINDOW_LIMIT_SCRIPT, SLIDING_WINDOW_REMAINING_TOKENS_SCRIPT } from './index';

function sha1(value: string): string {
    return createHash('sha1').update(value, 'utf8').digest('hex');
}

describe('sliding window Lua scripts', () => {
    it('limit script computes a stable SHA-1 fingerprint matching its content', () => {
        expect(SLIDING_WINDOW_LIMIT_SCRIPT.sha1).toBe(sha1(SLIDING_WINDOW_LIMIT_SCRIPT.script));
        expect(SLIDING_WINDOW_LIMIT_SCRIPT.sha1.length).toBe(40);
    });

    it('remaining tokens script computes a stable SHA-1 fingerprint matching its content', () => {
        expect(SLIDING_WINDOW_REMAINING_TOKENS_SCRIPT.sha1).toBe(
            sha1(SLIDING_WINDOW_REMAINING_TOKENS_SCRIPT.script),
        );
        expect(SLIDING_WINDOW_REMAINING_TOKENS_SCRIPT.sha1.length).toBe(40);
    });

    it('limit script contains the verbatim Upstash sliding-window contract markers', () => {
        const s = SLIDING_WINDOW_LIMIT_SCRIPT.script;
        expect(s.includes('local currentKey  = KEYS[1]')).toBe(true);
        expect(s.includes('local previousKey = KEYS[2]')).toBe(true);
        expect(s.includes('local dynamicLimitKey = KEYS[3]')).toBe(true);
        expect(s.includes('redis.call("INCRBY", currentKey, incrementBy)')).toBe(true);
        expect(s.includes('redis.call("PEXPIRE", currentKey, window * 2 + 1000)')).toBe(true);
        expect(s.includes('return {-1, effectiveLimit}')).toBe(true);
    });

    it('remaining tokens script does not mutate state (no INCRBY / PEXPIRE / SET)', () => {
        const s = SLIDING_WINDOW_REMAINING_TOKENS_SCRIPT.script;
        expect(s.includes('INCRBY')).toBe(false);
        expect(s.includes('PEXPIRE')).toBe(false);
        expect(/redis\.call\("SET"/.test(s)).toBe(false);
    });
});
