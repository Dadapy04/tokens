import { describe, expect, it } from 'bun:test';

import type { CoingeckoPriceRow, PricesRepo } from './handlers/prices';
import { createApp } from './server';

const NOW = new Date('2026-06-01T00:00:00Z');

const sampleRow = (overrides: Partial<CoingeckoPriceRow> = {}): CoingeckoPriceRow => ({
    id: 'cgp1',
    coin_id: 'bitcoin',
    price_usd: 65000.5,
    market_cap_usd: 1_280_000_000_000,
    volume_24h_usd: 24_500_000_000,
    price_change_24h_percent: 1.23,
    provider_last_updated_at: 1_717_200_000,
    last_fetched_at: 1_717_200_100_000,
    created_at: NOW,
    ...overrides,
});

function makeRepo(byCoinId: Record<string, CoingeckoPriceRow>): PricesRepo {
    return {
        findLatestByCoinId: async coinId => byCoinId[coinId] ?? null,
    };
}

async function call(app: ReturnType<typeof createApp>, path: string, init: RequestInit = {}) {
    return app.fetch(new Request(`http://test${path}`, init));
}

describe('createApp', () => {
    it('GET /healthz returns 200', async () => {
        const app = createApp({ repo: makeRepo({}), authToken: 'tok' });
        const res = await call(app, '/health');
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
    });

    it('POST /query/getLatestByCoinId returns the mapped snapshot', async () => {
        const app = createApp({
            repo: makeRepo({ bitcoin: sampleRow() }),
            authToken: 'tok',
        });
        const res = await call(app, '/query/getLatestByCoinId', {
            method: 'POST',
            headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
            body: JSON.stringify({ coinId: 'bitcoin' }),
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            coinId: 'bitcoin',
            priceUsd: 65000.5,
            marketCapUsd: 1_280_000_000_000,
            volume24hUsd: 24_500_000_000,
            priceChange24hPercent: 1.23,
            providerLastUpdatedAt: 1_717_200_000,
            lastFetchedAt: 1_717_200_100_000,
        });
    });

    it('POST /query/getLatestByCoinId returns null when row is missing', async () => {
        const app = createApp({ repo: makeRepo({}), authToken: 'tok' });
        const res = await call(app, '/query/getLatestByCoinId', {
            method: 'POST',
            headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
            body: JSON.stringify({ coinId: 'doge-nope' }),
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toBeNull();
    });

    it('POST /query/getLatestByCoinId trims coinId and returns null for blank input', async () => {
        const app = createApp({
            repo: makeRepo({ bitcoin: sampleRow() }),
            authToken: 'tok',
        });
        const trimmed = await call(app, '/query/getLatestByCoinId', {
            method: 'POST',
            headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
            body: JSON.stringify({ coinId: '  bitcoin  ' }),
        });
        const trimmedBody = (await trimmed.json()) as { coinId: string };
        expect(trimmedBody.coinId).toBe('bitcoin');

        const blank = await call(app, '/query/getLatestByCoinId', {
            method: 'POST',
            headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
            body: JSON.stringify({ coinId: '   ' }),
        });
        expect(blank.status).toBe(200);
        expect(await blank.json()).toBeNull();
    });

    it('POST /query/getLatestByCoinId preserves null metric fields', async () => {
        const app = createApp({
            repo: makeRepo({
                bitcoin: sampleRow({
                    price_usd: null,
                    market_cap_usd: null,
                    volume_24h_usd: null,
                    price_change_24h_percent: null,
                    provider_last_updated_at: null,
                }),
            }),
            authToken: 'tok',
        });
        const res = await call(app, '/query/getLatestByCoinId', {
            method: 'POST',
            headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
            body: JSON.stringify({ coinId: 'bitcoin' }),
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            coinId: 'bitcoin',
            priceUsd: null,
            marketCapUsd: null,
            volume24hUsd: null,
            priceChange24hPercent: null,
            providerLastUpdatedAt: null,
            lastFetchedAt: 1_717_200_100_000,
        });
    });

    it('POST /query/<name> rejects missing/wrong bearer with 401', async () => {
        const app = createApp({ repo: makeRepo({}), authToken: 'tok' });
        const noAuth = await call(app, '/query/getLatestByCoinId', { method: 'POST', body: '{}' });
        expect(noAuth.status).toBe(401);
        const wrongAuth = await call(app, '/query/getLatestByCoinId', {
            method: 'POST',
            headers: { authorization: 'Bearer nope' },
            body: '{}',
        });
        expect(wrongAuth.status).toBe(401);
    });

    it('POST /query/<unknown> returns 404', async () => {
        const app = createApp({ repo: makeRepo({}), authToken: 'tok' });
        const res = await call(app, '/query/doesNotExist', {
            method: 'POST',
            headers: { authorization: 'Bearer tok' },
            body: '{}',
        });
        expect(res.status).toBe(404);
    });

    it('POST /query/<prototype-method> returns 404', async () => {
        const app = createApp({ repo: makeRepo({}), authToken: 'tok' });
        for (const name of ['constructor', 'toString', 'valueOf', '__proto__', 'hasOwnProperty']) {
            const res = await call(app, `/query/${name}`, {
                method: 'POST',
                headers: { authorization: 'Bearer tok' },
                body: '{}',
            });
            expect(res.status).toBe(404);
        }
    });

    it('POST /query/getLatestByCoinId returns 400 on invalid args', async () => {
        const app = createApp({ repo: makeRepo({}), authToken: 'tok' });
        const cases: { body: string; reason: string }[] = [
            { body: '{}', reason: 'missing coinId' },
            { body: JSON.stringify({ coinId: 123 }), reason: 'non-string coinId' },
            { body: JSON.stringify({ coinId: null }), reason: 'null coinId' },
        ];
        for (const { body } of cases) {
            const res = await call(app, '/query/getLatestByCoinId', {
                method: 'POST',
                headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
                body,
            });
            expect(res.status).toBe(400);
            const payload = (await res.json()) as { error: string };
            expect(payload.error).toBe('invalid_args');
        }
    });

    it('POST /query/getLatestByCoinId hides handler-thrown DB error details', async () => {
        const failingRepo: PricesRepo = {
            findLatestByCoinId: async () => {
                throw new Error('relation "coingecko_prices_latest" does not exist on host db-internal');
            },
        };
        const app = createApp({ repo: failingRepo, authToken: 'tok' });
        const res = await call(app, '/query/getLatestByCoinId', {
            method: 'POST',
            headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
            body: JSON.stringify({ coinId: 'bitcoin' }),
        });
        expect(res.status).toBe(500);
        const payload = (await res.json()) as { error: string; message?: string };
        expect(payload.error).toBe('handler_error');
        expect(payload.message).toBeUndefined();
    });
});
