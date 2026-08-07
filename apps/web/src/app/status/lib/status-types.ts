export type StatusState = 'operational' | 'degraded' | 'down' | 'unknown';

export type StatusSource = 'loki' | 'unavailable';

export interface StatusProbeResult {
    name: string;
    target: string;
    method: string;
    path: string;
    status: number | null;
    durationMs: number;
    ok: boolean;
    attempts: number;
    error?: string;
}

export interface StatusSample {
    checkedAtMs: number;
    results: StatusProbeResult[];
}

export interface StatusFailure {
    checkedAt: string;
    probe: string;
    method: string;
    path: string;
    status: number | null;
    durationMs: number;
    message: string | null;
}

export interface StatusCurrent {
    state: StatusState;
    checkedAt: string | null;
    latencyMs: number | null;
    summary: string;
}

export interface StatusLiveCheck {
    state: Extract<StatusState, 'operational' | 'down' | 'unknown'>;
    checkedAt: string;
    latencyMs: number | null;
    status: number | null;
}

export interface StatusBucket {
    id: string;
    label: string;
    start: string;
    end: string;
    state: StatusState;
    sampleCount: number;
    expectedSamples: number;
    passCount: number;
    failCount: number;
    coverage: number;
    averageLatencyMs: number | null;
    failures: StatusFailure[];
}

export interface StatusOverviewResponse {
    kind: 'overview';
    generatedAt: string;
    source: StatusSource;
    current: StatusCurrent;
    daily: StatusBucket[];
    recentFailures: StatusFailure[];
    warning?: string;
    liveCheck?: StatusLiveCheck;
}

export interface StatusDayResponse {
    kind: 'day';
    generatedAt: string;
    source: StatusSource;
    selectedDate: string;
    hourly: StatusBucket[];
    recentFailures: StatusFailure[];
    warning?: string;
}

export type StatusApiResponse = StatusOverviewResponse | StatusDayResponse;
