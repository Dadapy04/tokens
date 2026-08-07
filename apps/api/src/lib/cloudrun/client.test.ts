import { describe, expect, it } from 'bun:test';

import { CloudRunCallError, CloudRunClient } from './client';

const BASE_URLS = { assets: 'https://tokens-assets-stg.example.run.app' } as const;

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

function clientWithFetch(fetchImpl: typeof fetch, timeoutMs?: number): CloudRunClient {
    return new CloudRunClient({
        baseUrls: BASE_URLS,
        authToken: 'test-token',
        fetch: fetchImpl,
        ...(timeoutMs !== undefined ? { timeoutMs } : {}),
    });
}

describe('CloudRunClient retries', () => {
    it('does not retry by default', async () => {
        let calls = 0;
        const client = clientWithFetch((async () => {
            calls++;
            return jsonResponse({ error: 'boom' }, 503);
        }) as typeof fetch);

        let thrown: unknown;
        try {
            await client.query('assets', 'someQuery');
        } catch (err) {
            thrown = err;
        }
        expect(thrown).toBeInstanceOf(CloudRunCallError);
        expect(calls).toBe(1);
    });

    it('retries a 5xx and succeeds on the second attempt', async () => {
        let calls = 0;
        const client = clientWithFetch((async () => {
            calls++;
            if (calls === 1) return jsonResponse({ error: 'boom' }, 503);
            return jsonResponse({ ok: true });
        }) as typeof fetch);

        const result = await client.query('assets', 'someQuery', {}, { maxRetries: 1, retryDelayMs: 1 });
        expect(result).toEqual({ ok: true });
        expect(calls).toBe(2);
    });

    it('retries network failures', async () => {
        let calls = 0;
        const client = clientWithFetch((async () => {
            calls++;
            if (calls === 1) throw new Error('socket hang up');
            return jsonResponse({ ok: true });
        }) as typeof fetch);

        const result = await client.query('assets', 'someQuery', {}, { maxRetries: 1, retryDelayMs: 1 });
        expect(result).toEqual({ ok: true });
        expect(calls).toBe(2);
    });

    it('does not retry a 4xx', async () => {
        let calls = 0;
        const client = clientWithFetch((async () => {
            calls++;
            return jsonResponse({ error: 'nope' }, 404);
        }) as typeof fetch);

        let thrown: unknown;
        try {
            await client.query('assets', 'someQuery', {}, { maxRetries: 3, retryDelayMs: 1 });
        } catch (err) {
            thrown = err;
        }
        expect(thrown).toBeInstanceOf(CloudRunCallError);
        expect((thrown as CloudRunCallError).status).toBe(404);
        expect(calls).toBe(1);
    });

    it('never retries mutations, even when maxRetries is set', async () => {
        let calls = 0;
        const client = clientWithFetch((async () => {
            calls++;
            return jsonResponse({ error: 'boom' }, 503);
        }) as typeof fetch);

        let thrown: unknown;
        try {
            await client.mutation('assets', 'someMutation', {}, { maxRetries: 3, retryDelayMs: 1 });
        } catch (err) {
            thrown = err;
        }
        expect(thrown).toBeInstanceOf(CloudRunCallError);
        expect(calls).toBe(1);
    });

    it('gives up after maxRetries and throws the last error', async () => {
        let calls = 0;
        const client = clientWithFetch((async () => {
            calls++;
            return jsonResponse({ error: 'boom' }, 502);
        }) as typeof fetch);

        let thrown: unknown;
        try {
            await client.query('assets', 'someQuery', {}, { maxRetries: 2, retryDelayMs: 1 });
        } catch (err) {
            thrown = err;
        }
        expect(thrown).toBeInstanceOf(CloudRunCallError);
        expect((thrown as CloudRunCallError).status).toBe(502);
        expect(calls).toBe(3);
    });
});

describe('CloudRunClient per-call timeout', () => {
    it('honors the per-call timeout override and reports it in the error', async () => {
        const hangingFetch = ((_url: unknown, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    const abortError = new Error('aborted');
                    abortError.name = 'AbortError';
                    reject(abortError);
                });
            })) as typeof fetch;

        // Client-level timeout is long; the per-call override must win.
        const client = clientWithFetch(hangingFetch, 60_000);

        let thrown: unknown;
        try {
            await client.query('assets', 'someQuery', {}, { timeoutMs: 20 });
        } catch (err) {
            thrown = err;
        }
        expect(thrown).toBeInstanceOf(CloudRunCallError);
        expect((thrown as CloudRunCallError).message).toContain('timed out after 20ms');
    });

    it('retries after a timeout', async () => {
        let calls = 0;
        const flakyFetch = ((_url: unknown, init?: RequestInit) => {
            calls++;
            if (calls === 1) {
                return new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => {
                        const abortError = new Error('aborted');
                        abortError.name = 'AbortError';
                        reject(abortError);
                    });
                });
            }
            return Promise.resolve(jsonResponse({ ok: true }));
        }) as typeof fetch;

        const client = clientWithFetch(flakyFetch);
        const result = await client.query(
            'assets',
            'someQuery',
            {},
            { timeoutMs: 20, maxRetries: 1, retryDelayMs: 1 },
        );
        expect(result).toEqual({ ok: true });
        expect(calls).toBe(2);
    });
});
