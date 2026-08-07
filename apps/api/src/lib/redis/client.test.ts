import { describe, expect, it } from 'bun:test';

import {
    getRedisTargetFromEnv,
    isMemorystoreEnabled,
    loadMemorystoreEnv,
    MissingMemorystoreEnvError,
} from './client';

describe('getRedisTargetFromEnv', () => {
    it('defaults to upstash when TOKENS_REDIS_TARGET is unset', () => {
        expect(getRedisTargetFromEnv({})).toBe('upstash');
    });

    it('returns upstash when TOKENS_REDIS_TARGET=upstash', () => {
        expect(getRedisTargetFromEnv({ TOKENS_REDIS_TARGET: 'upstash' })).toBe('upstash');
    });

    it('returns memorystore when TOKENS_REDIS_TARGET=memorystore (case-insensitive)', () => {
        expect(getRedisTargetFromEnv({ TOKENS_REDIS_TARGET: 'memorystore' })).toBe('memorystore');
        expect(getRedisTargetFromEnv({ TOKENS_REDIS_TARGET: 'MEMORYSTORE' })).toBe('memorystore');
        expect(getRedisTargetFromEnv({ TOKENS_REDIS_TARGET: '  Memorystore  ' })).toBe('memorystore');
    });

    it('falls back to upstash for unknown values', () => {
        expect(getRedisTargetFromEnv({ TOKENS_REDIS_TARGET: 'redis-cluster' })).toBe('upstash');
        expect(getRedisTargetFromEnv({ TOKENS_REDIS_TARGET: '' })).toBe('upstash');
    });
});

describe('isMemorystoreEnabled', () => {
    it('returns false by default', () => {
        expect(isMemorystoreEnabled({})).toBe(false);
    });

    it('returns true only when TOKENS_REDIS_TARGET is memorystore', () => {
        expect(isMemorystoreEnabled({ TOKENS_REDIS_TARGET: 'memorystore' })).toBe(true);
        expect(isMemorystoreEnabled({ TOKENS_REDIS_TARGET: 'upstash' })).toBe(false);
    });
});

describe('loadMemorystoreEnv', () => {
    it('throws when REDIS_HOST is missing', () => {
        let threw = false;
        try {
            loadMemorystoreEnv({});
        } catch (err) {
            threw = true;
            expect(err instanceof MissingMemorystoreEnvError).toBe(true);
            expect((err as Error).message.includes('REDIS_HOST')).toBe(true);
        }
        expect(threw).toBe(true);
    });

    it('throws when REDIS_PORT is missing', () => {
        let threw = false;
        try {
            loadMemorystoreEnv({ REDIS_HOST: '10.0.0.1' });
        } catch (err) {
            threw = true;
            expect((err as Error).message.includes('REDIS_PORT')).toBe(true);
        }
        expect(threw).toBe(true);
    });

    it('throws when REDIS_PORT is not a number', () => {
        let threw = false;
        try {
            loadMemorystoreEnv({ REDIS_HOST: '10.0.0.1', REDIS_PORT: 'abc' });
        } catch (err) {
            threw = true;
            expect((err as Error).message.includes('REDIS_PORT')).toBe(true);
        }
        expect(threw).toBe(true);
    });

    it('parses minimal config (host + port) with auth string defaulted to null', () => {
        const cfg = loadMemorystoreEnv({ REDIS_HOST: '10.0.0.1', REDIS_PORT: '6379' });
        expect(cfg.host).toBe('10.0.0.1');
        expect(cfg.port).toBe(6379);
        expect(cfg.authString).toBe(null);
        expect(cfg.tls).toBe(false);
    });

    it('reads REDIS_AUTH_STRING when present', () => {
        const cfg = loadMemorystoreEnv({
            REDIS_HOST: '10.0.0.1',
            REDIS_PORT: '6379',
            REDIS_AUTH_STRING: 'secret',
        });
        expect(cfg.authString).toBe('secret');
    });

    it('treats empty REDIS_AUTH_STRING as null', () => {
        const cfg = loadMemorystoreEnv({
            REDIS_HOST: '10.0.0.1',
            REDIS_PORT: '6379',
            REDIS_AUTH_STRING: '   ',
        });
        expect(cfg.authString).toBe(null);
    });

    it('respects REDIS_TLS=true', () => {
        const cfg = loadMemorystoreEnv({
            REDIS_HOST: '10.0.0.1',
            REDIS_PORT: '6379',
            REDIS_TLS: 'true',
        });
        expect(cfg.tls).toBe(true);
    });

    it('rejects out-of-range ports', () => {
        let threw = false;
        try {
            loadMemorystoreEnv({ REDIS_HOST: '10.0.0.1', REDIS_PORT: '99999' });
        } catch {
            threw = true;
        }
        expect(threw).toBe(true);
    });
});
