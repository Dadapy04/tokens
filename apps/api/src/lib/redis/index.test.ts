import { describe, expect, it } from 'bun:test';

import {
    __resetRedisClientForTesting,
    getRedisClient,
    MemorystoreClient,
    UpstashRedisClientAdapter,
} from './index';

const ENV_KEYS = [
    'TOKENS_REDIS_TARGET',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_AUTH_STRING',
    'REDIS_TLS',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
];

function withEnv<T>(overrides: Record<string, string | undefined>, fn: () => T): T {
    const saved: Record<string, string | undefined> = {};
    for (const k of ENV_KEYS) {
        saved[k] = process.env[k];
        delete process.env[k];
    }
    for (const [k, v] of Object.entries(overrides)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
    __resetRedisClientForTesting();
    try {
        return fn();
    } finally {
        for (const [k, v] of Object.entries(saved)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
        __resetRedisClientForTesting();
    }
}

describe('getRedisClient', () => {
    it('throws when upstash target is selected but credentials are missing', () => {
        withEnv({}, () => {
            let threw = false;
            try {
                getRedisClient();
            } catch (err) {
                threw = true;
                expect((err as Error).message.includes('UPSTASH_REDIS_REST_URL')).toBe(true);
            }
            expect(threw).toBe(true);
        });
    });

    it('returns an Upstash adapter when upstash creds are set', () => {
        withEnv(
            {
                UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'token',
            },
            () => {
                const client = getRedisClient();
                expect(client instanceof UpstashRedisClientAdapter).toBe(true);
            },
        );
    });

    it('returns a Memorystore client when TOKENS_REDIS_TARGET=memorystore', () => {
        withEnv(
            {
                TOKENS_REDIS_TARGET: 'memorystore',
                REDIS_HOST: '10.0.0.1',
                REDIS_PORT: '6379',
            },
            () => {
                const client = getRedisClient();
                expect(client instanceof MemorystoreClient).toBe(true);
            },
        );
    });

    it('memoizes the client when the target is unchanged', () => {
        withEnv(
            {
                UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'token',
            },
            () => {
                const a = getRedisClient();
                const b = getRedisClient();
                expect(a === b).toBe(true);
            },
        );
    });
});
