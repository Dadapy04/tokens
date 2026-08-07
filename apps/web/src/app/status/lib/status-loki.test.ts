import { describe, expect, mock, test } from 'bun:test';

mock.module('server-only', () => ({}));

const NOW_MS = Date.parse('2026-06-13T00:00:02.000Z');
const SELECTED_DATE = '2026-06-13';
const END_NS = BigInt(NOW_MS) * 1_000_000n;
const PAGE_LIMIT = 2_000;

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_DATE_NOW = Date.now;
const ORIGINAL_ENV = {
    TOKENS_STATUS_LOKI_URL: process.env.TOKENS_STATUS_LOKI_URL,
    TOKENS_STATUS_LOKI_USER: process.env.TOKENS_STATUS_LOKI_USER,
    TOKENS_STATUS_LOKI_TOKEN: process.env.TOKENS_STATUS_LOKI_TOKEN,
};

describe('status Loki', () => {
    test('does not mark history partial when the final page reaches the end boundary', async () => {
        Date.now = () => NOW_MS;
        process.env.TOKENS_STATUS_LOKI_URL = 'https://loki.example';
        process.env.TOKENS_STATUS_LOKI_USER = 'status';
        process.env.TOKENS_STATUS_LOKI_TOKEN = 'secret';

        let fetchCalls = 0;
        globalThis.fetch = (async () => {
            fetchCalls += 1;
            return Response.json({
                status: 'success',
                data: {
                    result: [
                        {
                            values: Array.from({ length: PAGE_LIMIT }, (_, index) =>
                                lokiValue(END_NS - BigInt(PAGE_LIMIT) + BigInt(index)),
                            ),
                        },
                    ],
                },
            });
        }) as typeof fetch;

        try {
            const { getStatusDay } = await import('./status-loki');

            const day = await getStatusDay(SELECTED_DATE);

            expect(fetchCalls).toBe(1);
            expect('warning' in day).toBe(false);
        } finally {
            globalThis.fetch = ORIGINAL_FETCH;
            Date.now = ORIGINAL_DATE_NOW;
            restoreEnv();
        }
    });
});

function lokiValue(timestampNs: bigint): [string, string] {
    return [
        timestampNs.toString(),
        JSON.stringify({
            event: 'smoke_canary_summary',
            results: [
                {
                    name: 'health-v1-unauth',
                    target: 'api',
                    method: 'GET',
                    path: '/api/v1/health',
                    status: 200,
                    durationMs: 100,
                    attempts: 1,
                    ok: true,
                },
            ],
        }),
    ];
}

function restoreEnv(): void {
    restoreEnvValue('TOKENS_STATUS_LOKI_URL', ORIGINAL_ENV.TOKENS_STATUS_LOKI_URL);
    restoreEnvValue('TOKENS_STATUS_LOKI_USER', ORIGINAL_ENV.TOKENS_STATUS_LOKI_USER);
    restoreEnvValue('TOKENS_STATUS_LOKI_TOKEN', ORIGINAL_ENV.TOKENS_STATUS_LOKI_TOKEN);
}

function restoreEnvValue(name: keyof typeof ORIGINAL_ENV, value: string | undefined): void {
    if (value === undefined) {
        delete process.env[name];
    } else {
        process.env[name] = value;
    }
}
