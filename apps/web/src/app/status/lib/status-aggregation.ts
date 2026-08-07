import type {
    StatusBucket,
    StatusCurrent,
    StatusFailure,
    StatusProbeResult,
    StatusSample,
    StatusState,
} from './status-types';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const FRESH_CANARY_MS = 3 * MINUTE_MS;
const MIN_COVERAGE = 0.95;
const RECENT_FAILURE_LIMIT = 10;

interface BuildOverviewOptions {
    nowMs: number;
    days?: number;
}

interface BuildDayOptions {
    nowMs: number;
}

interface BucketShape {
    id: string;
    label: string;
    startMs: number;
    endMs: number;
}

interface SampleClassification {
    state: StatusState;
    apiResults: StatusProbeResult[];
    failedApiResults: StatusProbeResult[];
}

export function buildStatusOverview(
    samples: StatusSample[],
    options: BuildOverviewOptions,
): {
    current: StatusCurrent;
    daily: StatusBucket[];
    recentFailures: StatusFailure[];
} {
    const sorted = sortSamples(samples);
    return {
        current: buildCurrentStatus(sorted, options.nowMs),
        daily: buildBuckets(sorted, createDailyBuckets(options.nowMs, options.days ?? 90), options.nowMs),
        recentFailures: collectRecentFailures(sorted),
    };
}

export function buildStatusDay(
    samples: StatusSample[],
    selectedDate: string,
    options: BuildDayOptions,
): {
    hourly: StatusBucket[];
    recentFailures: StatusFailure[];
} {
    const sorted = sortSamples(samples);
    return {
        hourly: buildBuckets(sorted, createHourlyBuckets(selectedDate), options.nowMs),
        recentFailures: collectRecentFailures(sorted),
    };
}

export function buildUnavailableOverview(
    nowMs: number,
    days = 90,
): {
    current: StatusCurrent;
    daily: StatusBucket[];
    recentFailures: StatusFailure[];
} {
    return {
        current: {
            state: 'unknown',
            checkedAt: null,
            latencyMs: null,
            summary: 'Status history is unavailable.',
        },
        daily: buildBuckets([], createDailyBuckets(nowMs, days), nowMs),
        recentFailures: [],
    };
}

export function buildUnavailableDay(
    selectedDate: string,
    nowMs: number,
): {
    hourly: StatusBucket[];
    recentFailures: StatusFailure[];
} {
    return {
        hourly: buildBuckets([], createHourlyBuckets(selectedDate), nowMs),
        recentFailures: [],
    };
}

export function isValidUtcDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = Date.parse(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(parsed)) return false;
    return formatUtcDate(parsed) === value;
}

export function utcDayStartMs(value: string | number): number {
    const date = typeof value === 'number' ? new Date(value) : new Date(`${value}T00:00:00.000Z`);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function buildCurrentStatus(samples: StatusSample[], nowMs: number): StatusCurrent {
    const latest = samples[samples.length - 1];
    if (!latest) {
        return {
            state: 'unknown',
            checkedAt: null,
            latencyMs: null,
            summary: 'No status checks have reported yet.',
        };
    }

    const ageMs = nowMs - latest.checkedAtMs;
    if (ageMs > FRESH_CANARY_MS || ageMs < -MINUTE_MS) {
        return {
            state: 'unknown',
            checkedAt: new Date(latest.checkedAtMs).toISOString(),
            latencyMs: latestLatencyMs(latest),
            summary: 'The latest status check is stale.',
        };
    }

    const classification = classifySample(latest);
    if (classification.state === 'operational') {
        return {
            state: 'operational',
            checkedAt: new Date(latest.checkedAtMs).toISOString(),
            latencyMs: latestLatencyMs(latest),
            summary: 'All API probes are passing.',
        };
    }

    if (classification.state === 'degraded') {
        return {
            state: 'degraded',
            checkedAt: new Date(latest.checkedAtMs).toISOString(),
            latencyMs: latestLatencyMs(latest),
            summary: 'Core health checks pass, but one or more API probes are failing.',
        };
    }

    if (classification.state === 'down') {
        return {
            state: 'down',
            checkedAt: new Date(latest.checkedAtMs).toISOString(),
            latencyMs: latestLatencyMs(latest),
            summary: 'API health checks are failing.',
        };
    }

    return {
        state: 'unknown',
        checkedAt: new Date(latest.checkedAtMs).toISOString(),
        latencyMs: latestLatencyMs(latest),
        summary: 'The latest status check did not include API probes.',
    };
}

function buildBuckets(samples: StatusSample[], buckets: BucketShape[], nowMs: number): StatusBucket[] {
    const samplesByBucket = new Map<string, StatusSample[]>();
    for (const sample of samples) {
        const bucket = buckets.find(
            candidate => sample.checkedAtMs >= candidate.startMs && sample.checkedAtMs < candidate.endMs,
        );
        if (!bucket) continue;
        const rows = samplesByBucket.get(bucket.id) ?? [];
        rows.push(sample);
        samplesByBucket.set(bucket.id, rows);
    }

    return buckets.map(bucket => buildBucket(bucket, samplesByBucket.get(bucket.id) ?? [], nowMs));
}

function buildBucket(bucket: BucketShape, samples: StatusSample[], nowMs: number): StatusBucket {
    const classifications = samples.map(classifySample);
    const apiSamples = classifications.filter(classification => classification.apiResults.length > 0);
    const failCount = classifications.reduce((sum, classification) => sum + classification.failedApiResults.length, 0);
    const passCount = apiSamples.length;
    const expectedSamples = expectedSamplesForBucket(bucket.startMs, bucket.endMs, nowMs);
    const sampleCount = apiSamples.length;
    const coverage = expectedSamples > 0 ? Math.min(1, sampleCount / expectedSamples) : 0;
    const failures = samples.flatMap(sample => failuresForSample(sample));
    const averageLatencyMs = averageLatency(samples);

    let state: StatusState;
    if (sampleCount === 0) state = 'unknown';
    else if (failCount > 0) state = 'down';
    else if (coverage < MIN_COVERAGE) state = 'degraded';
    else state = 'operational';

    return {
        id: bucket.id,
        label: bucket.label,
        start: new Date(bucket.startMs).toISOString(),
        end: new Date(bucket.endMs).toISOString(),
        state,
        sampleCount,
        expectedSamples,
        passCount,
        failCount,
        coverage,
        averageLatencyMs,
        failures,
    };
}

function classifySample(sample: StatusSample): SampleClassification {
    const apiResults = sample.results.filter(result => result.target === 'api');
    if (apiResults.length === 0) {
        return {
            state: 'unknown',
            apiResults,
            failedApiResults: [],
        };
    }

    const failedApiResults = apiResults.filter(result => !result.ok);
    const healthResults = apiResults.filter(isHealthProbe);
    const hasFailedHealth = healthResults.some(result => !result.ok);
    const allApiFailed = apiResults.every(result => !result.ok);

    if (hasFailedHealth || allApiFailed) {
        return {
            state: 'down',
            apiResults,
            failedApiResults,
        };
    }

    if (failedApiResults.length > 0) {
        return {
            state: 'degraded',
            apiResults,
            failedApiResults,
        };
    }

    return {
        state: 'operational',
        apiResults,
        failedApiResults,
    };
}

function failuresForSample(sample: StatusSample): StatusFailure[] {
    return classifySample(sample).failedApiResults.map(result => ({
        checkedAt: new Date(sample.checkedAtMs).toISOString(),
        probe: result.name,
        method: result.method,
        path: result.path,
        status: result.status,
        durationMs: result.durationMs,
        message: result.error ?? null,
    }));
}

function collectRecentFailures(samples: StatusSample[]): StatusFailure[] {
    return samples
        .flatMap(sample => failuresForSample(sample))
        .sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt))
        .slice(0, RECENT_FAILURE_LIMIT);
}

function latestLatencyMs(sample: StatusSample): number | null {
    const apiResults = sample.results.filter(result => result.target === 'api');
    const preferredHealth =
        apiResults.find(result => result.path === '/api/v1/health') ??
        apiResults.find(result => result.path === '/api/health') ??
        apiResults.find(isHealthProbe);

    if (preferredHealth && Number.isFinite(preferredHealth.durationMs)) return Math.max(0, preferredHealth.durationMs);
    return averageLatencyForResults(apiResults);
}

function averageLatency(samples: StatusSample[]): number | null {
    const latencies = samples.flatMap(sample =>
        sample.results.flatMap(result =>
            result.target === 'api' && Number.isFinite(result.durationMs) ? [Math.max(0, result.durationMs)] : [],
        ),
    );
    if (latencies.length === 0) return null;
    return Math.round(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length);
}

function averageLatencyForResults(results: StatusProbeResult[]): number | null {
    const latencies = results.flatMap(result =>
        Number.isFinite(result.durationMs) ? [Math.max(0, result.durationMs)] : [],
    );
    if (latencies.length === 0) return null;
    return Math.round(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length);
}

function isHealthProbe(result: StatusProbeResult): boolean {
    return result.path === '/api/health' || result.path === '/api/v1/health' || result.name.includes('health');
}

function expectedSamplesForBucket(startMs: number, endMs: number, nowMs: number): number {
    if (startMs > nowMs) return 0;
    const effectiveEndMs = Math.min(endMs, nowMs);
    const durationMs = Math.max(0, effectiveEndMs - startMs);
    return Math.max(1, Math.ceil(durationMs / MINUTE_MS));
}

function createDailyBuckets(nowMs: number, days: number): BucketShape[] {
    const todayStartMs = utcDayStartMs(nowMs);
    const firstStartMs = todayStartMs - (days - 1) * DAY_MS;

    return Array.from({ length: days }, (_, index) => {
        const startMs = firstStartMs + index * DAY_MS;
        return {
            id: formatUtcDate(startMs),
            label: formatDayLabel(startMs),
            startMs,
            endMs: startMs + DAY_MS,
        };
    });
}

function createHourlyBuckets(selectedDate: string): BucketShape[] {
    const dayStartMs = utcDayStartMs(selectedDate);

    return Array.from({ length: 24 }, (_, hour) => {
        const startMs = dayStartMs + hour * HOUR_MS;
        return {
            id: `${selectedDate}T${String(hour).padStart(2, '0')}:00Z`,
            label: `${String(hour).padStart(2, '0')}:00`,
            startMs,
            endMs: startMs + HOUR_MS,
        };
    });
}

function formatUtcDate(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

const DAY_LABEL_FORMAT = new Intl.DateTimeFormat('en', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
});

function formatDayLabel(ms: number): string {
    return DAY_LABEL_FORMAT.format(new Date(ms));
}

function sortSamples(samples: StatusSample[]): StatusSample[] {
    return [...samples].sort((a, b) => a.checkedAtMs - b.checkedAtMs);
}
