import 'server-only';

import { Buffer } from 'node:buffer';

import {
    buildStatusDay,
    buildStatusOverview,
    buildUnavailableDay,
    buildUnavailableOverview,
    utcDayStartMs,
} from './status-aggregation';
import type {
    StatusDayResponse,
    StatusLiveCheck,
    StatusOverviewResponse,
    StatusProbeResult,
    StatusSample,
} from './status-types';

const DAY_MS = 24 * 60 * 60_000;
const OVERVIEW_DAYS = 90;
const OVERVIEW_LIMIT = 5_000;
const OVERVIEW_MAX_PAGES = 40;
const DAY_LIMIT = 2_000;
const FETCH_TIMEOUT_MS = 10_000;
const LIVE_CHECK_TIMEOUT_MS = 2_500;

interface LokiConfig {
    url: string;
    auth: string;
    env: string;
    target: string;
}

interface LokiQueryResult {
    samples: StatusSample[];
    pageCapHit: boolean;
}

interface LokiStream {
    values?: unknown;
}

interface LokiQueryResponse {
    status?: unknown;
    data?: {
        result?: unknown;
    };
}

export async function getStatusOverview(): Promise<StatusOverviewResponse> {
    const nowMs = Date.now();
    const generatedAt = new Date(nowMs).toISOString();
    const config = getLokiConfig();

    if (!config) {
        const unavailable = buildUnavailableOverview(nowMs, OVERVIEW_DAYS);
        return {
            kind: 'overview',
            generatedAt,
            source: 'unavailable',
            ...unavailable,
            warning: 'Status history is not configured.',
            liveCheck: await fetchLiveCheck(),
        };
    }

    try {
        const todayStartMs = utcDayStartMs(nowMs);
        const startMs = todayStartMs - (OVERVIEW_DAYS - 1) * DAY_MS;
        const result = await querySmokeSamples(config, {
            startMs,
            endMs: nowMs,
            limit: OVERVIEW_LIMIT,
            maxPages: OVERVIEW_MAX_PAGES,
        });
        const overview = buildStatusOverview(result.samples, { nowMs, days: OVERVIEW_DAYS });

        return {
            kind: 'overview',
            generatedAt,
            source: 'loki',
            ...overview,
            ...(result.pageCapHit ? { warning: 'Status history is partial.' } : {}),
        };
    } catch {
        const unavailable = buildUnavailableOverview(nowMs, OVERVIEW_DAYS);
        return {
            kind: 'overview',
            generatedAt,
            source: 'unavailable',
            ...unavailable,
            warning: 'Status history is temporarily unavailable.',
            liveCheck: await fetchLiveCheck(),
        };
    }
}

export async function getStatusDay(selectedDate: string): Promise<StatusDayResponse> {
    const nowMs = Date.now();
    const generatedAt = new Date(nowMs).toISOString();
    const config = getLokiConfig();

    if (!config) {
        const unavailable = buildUnavailableDay(selectedDate, nowMs);
        return {
            kind: 'day',
            generatedAt,
            source: 'unavailable',
            selectedDate,
            ...unavailable,
            warning: 'Status history is not configured.',
        };
    }

    try {
        const startMs = utcDayStartMs(selectedDate);
        const endMs = Math.min(startMs + DAY_MS, nowMs);
        const result =
            endMs > startMs
                ? await querySmokeSamples(config, {
                      startMs,
                      endMs,
                      limit: DAY_LIMIT,
                      maxPages: 1,
                  })
                : { samples: [], pageCapHit: false };
        const day = buildStatusDay(result.samples, selectedDate, { nowMs });

        return {
            kind: 'day',
            generatedAt,
            source: 'loki',
            selectedDate,
            ...day,
            ...(result.pageCapHit ? { warning: 'Hourly status history is partial.' } : {}),
        };
    } catch {
        const unavailable = buildUnavailableDay(selectedDate, nowMs);
        return {
            kind: 'day',
            generatedAt,
            source: 'unavailable',
            selectedDate,
            ...unavailable,
            warning: 'Status history is temporarily unavailable.',
        };
    }
}

async function querySmokeSamples(
    config: LokiConfig,
    params: {
        startMs: number;
        endMs: number;
        limit: number;
        maxPages: number;
    },
): Promise<LokiQueryResult> {
    let startNs = toNs(params.startMs);
    const endNs = toNs(params.endMs);
    const samples: StatusSample[] = [];
    let pageCapHit = false;

    for (let page = 0; page < params.maxPages && startNs < endNs; page++) {
        const url = lokiApiUrl(config.url, 'query_range');
        url.searchParams.set('query', smokeLogQuery(config));
        url.searchParams.set('start', startNs.toString());
        url.searchParams.set('end', endNs.toString());
        url.searchParams.set('direction', 'forward');
        url.searchParams.set('limit', String(params.limit));

        const response = await fetchWithTimeout(url, {
            headers: { Authorization: config.auth },
            cache: 'no-store',
        });
        if (!response.ok) throw new Error('Loki query failed');

        const json = (await response.json()) as LokiQueryResponse;
        if (json.status !== 'success' || !Array.isArray(json.data?.result)) {
            throw new Error('Loki query returned an invalid response');
        }

        const values = json.data.result.flatMap(stream => {
            const maybeValues = (stream as LokiStream).values;
            return Array.isArray(maybeValues) ? maybeValues : [];
        });
        const parsed = values.map(parseLokiValue).filter((sample): sample is StatusSample => sample !== null);
        samples.push(...parsed);

        const lastNs = lastTimestampNs(values);
        if (values.length < params.limit || lastNs === null) return { samples, pageCapHit };
        startNs = lastNs + 1n;
        if (startNs >= endNs) return { samples, pageCapHit };
        pageCapHit = page === params.maxPages - 1;
    }

    return { samples, pageCapHit };
}

function parseLokiValue(value: unknown): StatusSample | null {
    if (!Array.isArray(value) || value.length < 2) return null;
    const [timestampNs, rawLine] = value;
    if (typeof timestampNs !== 'string' || typeof rawLine !== 'string') return null;

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawLine);
    } catch {
        return null;
    }

    if (!isRecord(parsed) || parsed.event !== 'smoke_canary_summary' || !Array.isArray(parsed.results)) return null;

    const results = parsed.results
        .map(parseProbeResult)
        .filter((result): result is StatusProbeResult => result !== null);
    if (results.length === 0) return null;

    return {
        checkedAtMs: Number(BigInt(timestampNs) / 1_000_000n),
        results,
    };
}

function parseProbeResult(value: unknown): StatusProbeResult | null {
    if (!isRecord(value)) return null;

    const name = stringValue(value.name);
    const target = stringValue(value.target);
    const method = stringValue(value.method);
    const path = stringValue(value.path);
    if (!name || !target || !method || !path) return null;

    const status = typeof value.status === 'number' && Number.isFinite(value.status) ? value.status : null;
    const durationMs =
        typeof value.durationMs === 'number' && Number.isFinite(value.durationMs) ? Math.max(0, value.durationMs) : 0;
    const attempts =
        typeof value.attempts === 'number' && Number.isFinite(value.attempts) ? Math.max(0, value.attempts) : 1;
    const ok = value.ok === true;
    const error = typeof value.error === 'string' && value.error.trim() ? value.error : undefined;

    return {
        name,
        target,
        method,
        path,
        status,
        durationMs,
        ok,
        attempts,
        ...(error ? { error } : {}),
    };
}

async function fetchLiveCheck(): Promise<StatusLiveCheck | undefined> {
    const origin = getApiOrigin();
    if (!origin) return undefined;

    const startedAt = Date.now();
    try {
        const response = await fetchWithTimeout(
            new URL('/api/v1/health', origin),
            {
                cache: 'no-store',
            },
            LIVE_CHECK_TIMEOUT_MS,
        );
        const text = await response.text();
        const latencyMs = Date.now() - startedAt;
        const ok = response.ok && isOkHealthBody(text);

        return {
            state: ok ? 'operational' : 'down',
            checkedAt: new Date().toISOString(),
            latencyMs,
            status: response.status,
        };
    } catch {
        return {
            state: 'down',
            checkedAt: new Date().toISOString(),
            latencyMs: Date.now() - startedAt,
            status: null,
        };
    }
}

function isOkHealthBody(text: string): boolean {
    if (!text.trim()) return false;
    try {
        const parsed = JSON.parse(text) as unknown;
        return isRecord(parsed) && parsed.ok === true;
    } catch {
        return false;
    }
}

function getApiOrigin(): string | null {
    const raw = process.env.API_BASE_URL?.trim() ?? process.env.TOKENS_API_ORIGIN?.trim() ?? '';
    if (!raw) return null;
    return raw.replace(/\/$/, '');
}

async function fetchWithTimeout(url: URL, init: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

function getLokiConfig(): LokiConfig | null {
    const url = readEnv('TOKENS_STATUS_LOKI_URL') ?? readEnv('GRAFANA_LOKI_URL');
    const user = readEnv('TOKENS_STATUS_LOKI_USER') ?? readEnv('GRAFANA_LOKI_USER');
    const token = readEnv('TOKENS_STATUS_LOKI_TOKEN') ?? readEnv('GRAFANA_LOKI_TOKEN');
    if (!url || !user || !token) return null;

    return {
        url,
        auth: `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`,
        env: readEnv('TOKENS_STATUS_LOKI_ENV') ?? 'prd',
        target: readEnv('TOKENS_STATUS_LOKI_TARGET') ?? 'prod',
    };
}

function lokiApiUrl(baseUrl: string, path: 'query_range'): URL {
    const trimmed = baseUrl.trim().replace(/\/$/, '');
    if (trimmed.endsWith('/loki/api/v1/push')) {
        return new URL(`${trimmed.slice(0, -'/push'.length)}/${path}`);
    }
    if (trimmed.endsWith('/loki/api/v1')) {
        return new URL(`${trimmed}/${path}`);
    }
    return new URL(`${trimmed}/loki/api/v1/${path}`);
}

function smokeLogQuery(config: LokiConfig): string {
    return `{service="tokens-smoke", env="${escapeLogLabelValue(config.env)}", target="${escapeLogLabelValue(
        config.target,
    )}"} | json | event="smoke_canary_summary"`;
}

function escapeLogLabelValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function lastTimestampNs(values: unknown[]): bigint | null {
    for (let index = values.length - 1; index >= 0; index--) {
        const value = values[index];
        if (!Array.isArray(value)) continue;
        const timestamp = value[0];
        if (typeof timestamp !== 'string') continue;
        try {
            return BigInt(timestamp);
        } catch {
            return null;
        }
    }
    return null;
}

function toNs(ms: number): bigint {
    return BigInt(Math.floor(ms)) * 1_000_000n;
}

function readEnv(name: string): string | null {
    const value = process.env[name]?.trim();
    return value ? value : null;
}

function stringValue(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
