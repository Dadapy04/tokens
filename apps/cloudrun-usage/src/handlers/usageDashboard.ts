/**
 * Dashboard usage analytics.
 *
 * Ports of `convex/auth.ts` `getProjectUsageStats`, `getProjectUsageTimeSeries`,
 * and `getEndpointPerformance`, including the rollup + recent-raw-event merge
 * and the deprecated response fields the UI still reads.
 *
 * Two deliberate deltas from Convex:
 * - **Membership enforcement**: Convex relied on unguessable project IDs;
 *   here the caller identity must be a member of the project (403 otherwise).
 * - **Cursor semantics**: the GCP rollup job (cloudrun-assets) stores the last
 *   processed event `ts` in `api_request_rollup_state.cursor_creation_time`
 *   (Convex stored `_creationTime`), so "unrolled events" = `ts > cursor`.
 */

import { resolveEffectiveClerkUserId, type IdentityRepo } from './clerkIdentity';
import { IdentityRequiredError, InvalidArgsError, UnauthorizedError } from './errors';
import {
    addLatencyHistograms,
    binLatencyMs,
    emptyLatencyHistogram,
    p95FromHistogram,
} from './histogram';
import type { CallerIdentity } from '../server';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_MONTHLY_QUOTA = 1_000_000;
const DASHBOARD_FALLBACK_MAX_EVENTS = 1_000;

export interface DailyRollupRow {
    day: string; // 'YYYY-MM-DD'
    totalCalls: number;
    assetCalls: number;
    successCalls: number;
    sumLatencyMs: number;
}

export interface EndpointRollupRow {
    day: string;
    endpoint: string;
    calls: number;
    successCalls: number;
    sumLatencyMs: number;
    latencyHistogram: unknown;
}

export interface RawUsageEvent {
    endpoint: string;
    status: number;
    latencyMs: number;
    ts: number;
}

export interface UsageDashboardRepo {
    hasProjectMembership(projectId: string, clerkUserId: string): Promise<boolean>;
    getProjectLimits(projectId: string): Promise<{ exists: boolean; limits: unknown }>;
    /** `api_request_rollup_state.cursor_creation_time` (event ts) or null when no state row. */
    getRollupCursor(projectId: string): Promise<number | null>;
    getDailyRollups(projectId: string, fromDayKey: string, limit: number): Promise<DailyRollupRow[]>;
    getEndpointDailyRollups(projectId: string, fromDayKey: string, limit: number): Promise<EndpointRollupRow[]>;
    /** Events with `ts > afterTs`, ascending, capped. */
    getEventsAfterTs(projectId: string, afterTs: number, cap: number): Promise<RawUsageEvent[]>;
    /** Active (non-revoked) keys in the project with last_used_at >= sinceMs. */
    countActiveKeysUsedSince(projectId: string, sinceMs: number): Promise<number>;
}

export interface UsageDashboardDeps {
    repo: UsageDashboardRepo;
    identity: IdentityRepo;
    now?: () => number;
}

function clampDays(raw: unknown): number {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 7;
    return Math.min(30, Math.max(1, Math.floor(n)));
}

function startOfDayUtc(ms: number): number {
    const d = new Date(ms);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

function startOfMonthUtc(ms: number): number {
    const d = new Date(ms);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0);
}

function dateKeyUtc(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

function isAssetEndpoint(endpoint: string): boolean {
    return endpoint.startsWith('/api/v1/assets');
}

async function requireProjectMember(
    deps: UsageDashboardDeps,
    identity: CallerIdentity | null,
    projectId: string,
): Promise<void> {
    if (!identity) throw new IdentityRequiredError();
    const clerkUserId = await resolveEffectiveClerkUserId(deps.identity, identity.clerkUserId, identity.email ?? null);
    const isMember = await deps.repo.hasProjectMembership(projectId, clerkUserId);
    if (!isMember) throw new UnauthorizedError();
}

function parseArgs(args: unknown): { projectId: string; days?: unknown } {
    if (typeof args !== 'object' || args === null) throw new InvalidArgsError('args must be an object');
    const a = args as Record<string, unknown>;
    if (typeof a.projectId !== 'string' || !a.projectId.trim()) {
        throw new InvalidArgsError('projectId must be a non-empty string');
    }
    return { projectId: a.projectId, days: a.days };
}

/**
 * Port of Convex `loadDashboardRawEvents` adapted to ts-based cursors:
 * - cursor exists and > 0 → unrolled events are `ts > cursor` (also >= fromTs)
 * - no cursor but rollups exist in window → [] (everything settled is rolled up)
 * - no cursor, no rollups → fall back to all events in window
 */
async function loadDashboardRawEvents(
    repo: UsageDashboardRepo,
    projectId: string,
    fromTs: number,
    hasRollupsInWindow: boolean,
): Promise<RawUsageEvent[]> {
    const cursor = await repo.getRollupCursor(projectId);
    if (cursor !== null && cursor > 0) {
        return repo.getEventsAfterTs(projectId, Math.max(fromTs - 1, cursor), DASHBOARD_FALLBACK_MAX_EVENTS);
    }
    if (hasRollupsInWindow) return [];
    return repo.getEventsAfterTs(projectId, fromTs - 1, DASHBOARD_FALLBACK_MAX_EVENTS);
}

// ---------------------------------------------------------------------------
// getProjectUsageStats
// ---------------------------------------------------------------------------

export interface UsageStats {
    assetCallsThisMonth: number;
    assetCallsToday: number;
    memoriesStored: number;
    memoriesArchived: number;
    totalStorageBytes: number;
    averageMemorySize: number;
    retrievalCalls: number;
    storeCalls: number;
    totalApiCalls: number;
    totalApiOperationsThisMonth: number;
    averageResponseTime: number;
    successRate: number;
    memoriesAddedToday: number;
    memoriesAddedThisWeek: number;
    memoriesAddedThisMonth: number;
    uniqueUsers: number;
    monthlyQuotaUsed: number;
    monthlyQuotaLimit: number;
    estimatedMonthlyCost: number;
}

function normalizeMonthlyQuotaLimit(value: unknown): number {
    if (value === -1) return DEFAULT_MONTHLY_QUOTA;
    if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_MONTHLY_QUOTA;
    return Math.max(0, Math.floor(value));
}

function emptyUsageStats(monthlyQuotaLimit: number): UsageStats {
    return {
        assetCallsThisMonth: 0,
        assetCallsToday: 0,
        memoriesStored: 0,
        memoriesArchived: 0,
        totalStorageBytes: 0,
        averageMemorySize: 0,
        retrievalCalls: 0,
        storeCalls: 0,
        totalApiCalls: 0,
        totalApiOperationsThisMonth: 0,
        averageResponseTime: 0,
        successRate: 0,
        memoriesAddedToday: 0,
        memoriesAddedThisWeek: 0,
        memoriesAddedThisMonth: 0,
        uniqueUsers: 0,
        monthlyQuotaUsed: 0,
        monthlyQuotaLimit,
        estimatedMonthlyCost: 0,
    };
}

export async function usageGetProjectUsageStats(
    deps: UsageDashboardDeps,
    args: unknown,
    identity: CallerIdentity | null,
): Promise<UsageStats> {
    const { projectId } = parseArgs(args);
    await requireProjectMember(deps, identity, projectId);

    const nowMs = (deps.now ?? Date.now)();
    const todayStart = startOfDayUtc(nowMs);
    const weekStart = startOfDayUtc(nowMs - 6 * MS_PER_DAY);
    const monthStart = startOfMonthUtc(nowMs);
    const from = Math.min(weekStart, monthStart);

    const { limits } = await deps.repo.getProjectLimits(projectId);
    const quota = (limits as { quota?: { requestsPerMonth?: unknown } } | null)?.quota?.requestsPerMonth;
    const monthlyQuotaLimit = normalizeMonthlyQuotaLimit(quota);

    const fromKey = dateKeyUtc(from);
    const weekKey = dateKeyUtc(weekStart);
    const monthKey = dateKeyUtc(monthStart);
    const todayKey = dateKeyUtc(todayStart);

    try {
        const dailyRollups = await deps.repo.getDailyRollups(projectId, fromKey, 60);

        let totalCallsWeek = 0;
        let assetCallsWeek = 0;
        let sumLatencyWeek = 0;
        let successCallsWeek = 0;

        let totalCallsMonth = 0;
        let assetCallsMonth = 0;

        let assetCallsToday = 0;

        for (const row of dailyRollups) {
            const day = row.day;
            const calls = Number.isFinite(row.totalCalls) ? row.totalCalls : 0;
            const assetCalls = Number.isFinite(row.assetCalls) ? row.assetCalls : 0;
            const successCalls = Number.isFinite(row.successCalls) ? row.successCalls : 0;
            const sumLatency = Number.isFinite(row.sumLatencyMs) ? row.sumLatencyMs : 0;

            if (day >= weekKey) {
                totalCallsWeek += calls;
                assetCallsWeek += assetCalls;
                successCallsWeek += successCalls;
                sumLatencyWeek += sumLatency;
            }
            if (day >= monthKey) {
                totalCallsMonth += calls;
                assetCallsMonth += assetCalls;
            }
            if (day === todayKey) {
                assetCallsToday += assetCalls;
            }
        }

        const events = await loadDashboardRawEvents(deps.repo, projectId, from, dailyRollups.length > 0);
        for (const event of events) {
            const day = dateKeyUtc(event.ts);
            const isAsset = isAssetEndpoint(event.endpoint);
            const isSuccess = event.status < 400;
            const latencyMs = Number.isFinite(event.latencyMs) ? Math.max(0, Math.floor(event.latencyMs)) : 0;

            if (day >= weekKey) {
                totalCallsWeek += 1;
                if (isAsset) assetCallsWeek += 1;
                if (isSuccess) successCallsWeek += 1;
                sumLatencyWeek += latencyMs;
            }
            if (day >= monthKey) {
                totalCallsMonth += 1;
                if (isAsset) assetCallsMonth += 1;
            }
            if (day === todayKey && isAsset) {
                assetCallsToday += 1;
            }
        }

        const averageResponseTime = totalCallsWeek > 0 ? Math.round(sumLatencyWeek / totalCallsWeek) : 0;
        const successRate = totalCallsWeek > 0 ? Number(((successCallsWeek / totalCallsWeek) * 100).toFixed(1)) : 0;

        const uniqueUsers = await deps.repo.countActiveKeysUsedSince(projectId, monthStart);

        return {
            assetCallsThisMonth: assetCallsMonth,
            assetCallsToday,
            // Deprecated aliases retained for one release.
            memoriesStored: assetCallsMonth,
            memoriesArchived: 0,
            totalStorageBytes: 0,
            averageMemorySize: 0,

            // Treat asset reads as "retrievals" for now.
            retrievalCalls: assetCallsWeek,
            storeCalls: Math.max(0, totalCallsWeek - assetCallsWeek),
            totalApiCalls: totalCallsWeek,
            totalApiOperationsThisMonth: totalCallsMonth,

            averageResponseTime,
            successRate,

            memoriesAddedToday: assetCallsToday,
            memoriesAddedThisWeek: assetCallsWeek,
            memoriesAddedThisMonth: assetCallsMonth,

            uniqueUsers,

            monthlyQuotaUsed: totalCallsMonth,
            monthlyQuotaLimit,
            estimatedMonthlyCost: 0,
        };
    } catch (err) {
        console.error(
            `[usageGetProjectUsageStats] failed for projectId=${projectId}`,
            err instanceof Error ? err.message : String(err),
        );
        return emptyUsageStats(monthlyQuotaLimit);
    }
}

// ---------------------------------------------------------------------------
// getProjectUsageTimeSeries
// ---------------------------------------------------------------------------

export interface UsageTimeSeriesPoint {
    date: string;
    apiCalls: number;
    assetCalls: number;
    /** @deprecated Use assetCalls. */
    memories: number;
    users: number;
}

export async function usageGetProjectUsageTimeSeries(
    deps: UsageDashboardDeps,
    args: unknown,
    identity: CallerIdentity | null,
): Promise<UsageTimeSeriesPoint[]> {
    const { projectId, days: rawDays } = parseArgs(args);
    await requireProjectMember(deps, identity, projectId);

    const days = clampDays(rawDays);
    const nowMs = (deps.now ?? Date.now)();
    const from = startOfDayUtc(nowMs - (days - 1) * MS_PER_DAY);
    const fromKey = dateKeyUtc(from);

    const rollups = await deps.repo.getDailyRollups(projectId, fromKey, days + 2);

    const byDay = new Map<string, { totalCalls: number; assetCalls: number }>();
    for (const row of rollups) {
        byDay.set(row.day, { totalCalls: row.totalCalls, assetCalls: row.assetCalls });
    }

    const events = await loadDashboardRawEvents(deps.repo, projectId, from, rollups.length > 0);
    for (const event of events) {
        const day = dateKeyUtc(event.ts);
        const bucket = byDay.get(day) ?? { totalCalls: 0, assetCalls: 0 };
        bucket.totalCalls += 1;
        if (isAssetEndpoint(event.endpoint)) bucket.assetCalls += 1;
        byDay.set(day, bucket);
    }

    const output: UsageTimeSeriesPoint[] = [];
    for (let i = 0; i < days; i++) {
        const key = dateKeyUtc(from + i * MS_PER_DAY);
        const bucket = byDay.get(key) ?? { totalCalls: 0, assetCalls: 0 };
        output.push({
            date: key,
            apiCalls: bucket.totalCalls,
            assetCalls: bucket.assetCalls,
            memories: bucket.assetCalls,
            users: 0,
        });
    }

    return output;
}

// ---------------------------------------------------------------------------
// getEndpointPerformance
// ---------------------------------------------------------------------------

export interface EndpointPerformanceRow {
    endpoint: string;
    avgTime: number;
    p95: number;
    calls: number;
    trend: 'improving' | 'degrading' | 'stable';
    zone: 'excellent' | 'good' | 'acceptable' | 'slow';
    successRate: number;
}

export async function usageGetEndpointPerformance(
    deps: UsageDashboardDeps,
    args: unknown,
    identity: CallerIdentity | null,
): Promise<EndpointPerformanceRow[]> {
    const { projectId, days: rawDays } = parseArgs(args);
    await requireProjectMember(deps, identity, projectId);

    const days = clampDays(rawDays);
    const nowMs = (deps.now ?? Date.now)();
    const from = startOfDayUtc(nowMs - (days - 1) * MS_PER_DAY);
    const fromKey = dateKeyUtc(from);
    const mid = nowMs - Math.floor((days * MS_PER_DAY) / 2);

    type Acc = {
        calls: number;
        success: number;
        sumLatency: number;
        histogram: number[];
        prevSum: number;
        prevCount: number;
        currSum: number;
        currCount: number;
    };

    const emptyAcc = (): Acc => ({
        calls: 0,
        success: 0,
        sumLatency: 0,
        histogram: emptyLatencyHistogram(),
        prevSum: 0,
        prevCount: 0,
        currSum: 0,
        currCount: 0,
    });

    const byEndpoint = new Map<string, Acc>();

    const rollups = await deps.repo.getEndpointDailyRollups(projectId, fromKey, days * 500);
    for (const row of rollups) {
        const acc = byEndpoint.get(row.endpoint) ?? emptyAcc();

        const calls = Number.isFinite(row.calls) ? row.calls : 0;
        const successCalls = Number.isFinite(row.successCalls) ? row.successCalls : 0;
        const sumLatencyMs = Number.isFinite(row.sumLatencyMs) ? row.sumLatencyMs : 0;

        acc.calls += calls;
        acc.success += successCalls;
        acc.sumLatency += sumLatencyMs;
        acc.histogram = addLatencyHistograms(acc.histogram, (row.latencyHistogram as number[]) ?? []);

        const [yy, mm, dd] = String(row.day).split('-').map(Number);
        const dayStart = Date.UTC(yy ?? 1970, Math.max(0, (mm ?? 1) - 1), dd ?? 1, 0, 0, 0, 0);

        if (dayStart >= mid) {
            acc.currSum += sumLatencyMs;
            acc.currCount += calls;
        } else {
            acc.prevSum += sumLatencyMs;
            acc.prevCount += calls;
        }

        if (!byEndpoint.has(row.endpoint)) byEndpoint.set(row.endpoint, acc);
    }

    const events = await loadDashboardRawEvents(deps.repo, projectId, from, rollups.length > 0);
    for (const event of events) {
        const acc = byEndpoint.get(event.endpoint) ?? emptyAcc();

        const latencyMs = Number.isFinite(event.latencyMs) ? Math.max(0, Math.floor(event.latencyMs)) : 0;
        const isSuccess = event.status < 400;

        acc.calls += 1;
        if (isSuccess) acc.success += 1;
        acc.sumLatency += latencyMs;
        const bin = binLatencyMs(latencyMs);
        const histogram = emptyLatencyHistogram();
        histogram[bin] = 1;
        acc.histogram = addLatencyHistograms(acc.histogram, histogram);

        if (event.ts >= mid) {
            acc.currSum += latencyMs;
            acc.currCount += 1;
        } else {
            acc.prevSum += latencyMs;
            acc.prevCount += 1;
        }

        if (!byEndpoint.has(event.endpoint)) byEndpoint.set(event.endpoint, acc);
    }

    const rows: EndpointPerformanceRow[] = [];
    for (const [endpoint, acc] of byEndpoint) {
        const avg = acc.calls > 0 ? acc.sumLatency / acc.calls : 0;
        const p95 = p95FromHistogram(acc.histogram);

        const prevAvg = acc.prevCount > 0 ? acc.prevSum / acc.prevCount : null;
        const currAvg = acc.currCount > 0 ? acc.currSum / acc.currCount : avg;

        let trend: EndpointPerformanceRow['trend'] = 'stable';
        if (prevAvg !== null && prevAvg > 0) {
            const delta = (currAvg - prevAvg) / prevAvg;
            if (delta <= -0.1) trend = 'improving';
            else if (delta >= 0.1) trend = 'degrading';
        }

        const avgRounded = Math.max(0, Math.round(avg));
        const zone: EndpointPerformanceRow['zone'] =
            avgRounded < 100 ? 'excellent' : avgRounded < 300 ? 'good' : avgRounded < 600 ? 'acceptable' : 'slow';

        const successRate = acc.calls > 0 ? (acc.success / acc.calls) * 100 : 0;

        rows.push({
            endpoint,
            avgTime: avgRounded,
            p95: Math.max(0, Math.round(p95)),
            calls: acc.calls,
            trend,
            zone,
            successRate: Number(successRate.toFixed(1)),
        });
    }

    rows.sort((a, b) => b.calls - a.calls);
    return rows.slice(0, 12);
}
