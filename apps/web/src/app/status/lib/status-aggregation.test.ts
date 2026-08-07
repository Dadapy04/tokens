import { describe, expect, test } from 'bun:test';

import { buildStatusDay, buildStatusOverview, utcDayStartMs } from './status-aggregation';
import type { StatusProbeResult, StatusSample } from './status-types';

const NOW_MS = Date.parse('2026-06-13T12:00:00.000Z');
const DAY_START_MS = utcDayStartMs(NOW_MS);

describe('status aggregation', () => {
    test('all API samples passing produces green daily and hourly bars', () => {
        const samples = minuteSamples(DAY_START_MS, NOW_MS, ms => sample(ms, [apiHealth(), apiSearch()]));

        const overview = buildStatusOverview(samples, { nowMs: NOW_MS });
        const day = buildStatusDay(samples, '2026-06-13', { nowMs: NOW_MS });

        expect(overview.current.state).toBe('operational');
        expect(overview.daily.at(-1)?.state).toBe('operational');
        expect(day.hourly[0]?.state).toBe('operational');
        expect(day.hourly[11]?.state).toBe('operational');
    });

    test('API health probe failure marks current status and bucket down', () => {
        const samples = [sample(NOW_MS - 30_000, [apiHealth({ ok: false, status: 503 })])];

        const overview = buildStatusOverview(samples, { nowMs: NOW_MS, days: 1 });

        expect(overview.current.state).toBe('down');
        expect(overview.daily[0]?.state).toBe('down');
        expect(overview.recentFailures[0]?.path).toBe('/api/v1/health');
    });

    test('non-health API probe failure marks current status degraded and bucket red', () => {
        const samples = [
            sample(NOW_MS - 30_000, [
                apiHealth(),
                apiSearch({ ok: false, status: 500, error: 'expected 200, got 500' }),
            ]),
        ];

        const overview = buildStatusOverview(samples, { nowMs: NOW_MS, days: 1 });

        expect(overview.current.state).toBe('degraded');
        expect(overview.daily[0]?.state).toBe('down');
        expect(overview.recentFailures[0]?.path).toBe('/api/v1/assets/search?q=sol&limit=5');
    });

    test('app probe failures are ignored when API probes pass', () => {
        const samples = [
            sample(NOW_MS - 30_000, [
                apiHealth(),
                apiSearch(),
                appHome({ ok: false, status: 500, error: 'app failed' }),
            ]),
        ];

        const overview = buildStatusOverview(samples, { nowMs: NOW_MS, days: 1 });

        expect(overview.current.state).toBe('operational');
        expect(overview.recentFailures).toHaveLength(0);
    });

    test('missing samples produce gray unknown buckets', () => {
        const overview = buildStatusOverview([], { nowMs: NOW_MS, days: 1 });
        const day = buildStatusDay([], '2026-06-13', { nowMs: NOW_MS });

        expect(overview.current.state).toBe('unknown');
        expect(overview.daily[0]?.state).toBe('unknown');
        expect(day.hourly.every(bucket => bucket.state === 'unknown')).toBe(true);
    });

    test('stale latest sample produces unknown current status', () => {
        const samples = [sample(NOW_MS - 10 * 60_000, [apiHealth(), apiSearch()])];

        const overview = buildStatusOverview(samples, { nowMs: NOW_MS, days: 1 });

        expect(overview.current.state).toBe('unknown');
        expect(overview.current.summary).toContain('stale');
    });
});

function minuteSamples(startMs: number, endMs: number, createSample: (ms: number) => StatusSample): StatusSample[] {
    const samples: StatusSample[] = [];
    for (let ms = startMs; ms < endMs; ms += 60_000) {
        samples.push(createSample(ms));
    }
    return samples;
}

function sample(checkedAtMs: number, results: StatusProbeResult[]): StatusSample {
    return { checkedAtMs, results };
}

function apiHealth(overrides: Partial<StatusProbeResult> = {}): StatusProbeResult {
    return probe({
        name: 'health-v1-unauth',
        target: 'api',
        path: '/api/v1/health',
        ...overrides,
    });
}

function apiSearch(overrides: Partial<StatusProbeResult> = {}): StatusProbeResult {
    return probe({
        name: 'assets-search',
        target: 'api',
        path: '/api/v1/assets/search?q=sol&limit=5',
        ...overrides,
    });
}

function appHome(overrides: Partial<StatusProbeResult> = {}): StatusProbeResult {
    return probe({
        name: 'app-home',
        target: 'app',
        path: '/',
        ...overrides,
    });
}

function probe(
    params: Partial<StatusProbeResult> & Pick<StatusProbeResult, 'name' | 'target' | 'path'>,
): StatusProbeResult {
    return {
        method: 'GET',
        status: 200,
        durationMs: 100,
        ok: true,
        attempts: 1,
        ...params,
    };
}
