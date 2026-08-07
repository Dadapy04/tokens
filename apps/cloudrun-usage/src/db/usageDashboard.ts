import type { Sql } from 'postgres';

import type { UsageDashboardRepo } from '../handlers/usageDashboard';

function toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function makePostgresUsageDashboardRepo(sql: Sql): UsageDashboardRepo {
    return {
        async hasProjectMembership(projectId, clerkUserId) {
            const rows = await sql<{ ok: number }[]>`
                SELECT 1 AS ok FROM project_members
                WHERE project_id = ${projectId} AND clerk_user_id = ${clerkUserId}
                LIMIT 1
            `;
            return rows.length > 0;
        },

        async getProjectLimits(projectId) {
            const rows = await sql<{ limits: unknown }[]>`
                SELECT limits FROM projects WHERE id = ${projectId} LIMIT 1
            `;
            const row = rows[0];
            if (!row) return { exists: false, limits: null };
            return { exists: true, limits: row.limits };
        },

        async getRollupCursor(projectId) {
            const rows = await sql<{ cursor_creation_time: string | number }[]>`
                SELECT cursor_creation_time FROM api_request_rollup_state
                WHERE project_id = ${projectId}
                LIMIT 1
            `;
            const row = rows[0];
            if (!row) return null;
            return toNumber(row.cursor_creation_time);
        },

        async getDailyRollups(projectId, fromDayKey, limit) {
            const rows = await sql<
                {
                    day: string;
                    total_calls: string | number;
                    asset_calls: string | number;
                    success_calls: string | number;
                    sum_latency_ms: string | number;
                }[]
            >`
                SELECT day::text AS day, total_calls, asset_calls, success_calls, sum_latency_ms
                FROM api_request_daily_rollups
                WHERE project_id = ${projectId} AND day >= ${fromDayKey}::date
                ORDER BY day ASC
                LIMIT ${limit}
            `;
            return rows.map(row => ({
                day: row.day,
                totalCalls: toNumber(row.total_calls),
                assetCalls: toNumber(row.asset_calls),
                successCalls: toNumber(row.success_calls),
                sumLatencyMs: toNumber(row.sum_latency_ms),
            }));
        },

        async getEndpointDailyRollups(projectId, fromDayKey, limit) {
            const rows = await sql<
                {
                    day: string;
                    endpoint: string;
                    calls: string | number;
                    success_calls: string | number;
                    sum_latency_ms: string | number;
                    latency_histogram: unknown;
                }[]
            >`
                SELECT day::text AS day, endpoint, calls, success_calls, sum_latency_ms, latency_histogram
                FROM api_request_endpoint_daily_rollups
                WHERE project_id = ${projectId} AND day >= ${fromDayKey}::date
                ORDER BY day ASC
                LIMIT ${limit}
            `;
            return rows.map(row => ({
                day: row.day,
                endpoint: row.endpoint,
                calls: toNumber(row.calls),
                successCalls: toNumber(row.success_calls),
                sumLatencyMs: toNumber(row.sum_latency_ms),
                latencyHistogram: row.latency_histogram,
            }));
        },

        async getEventsAfterTs(projectId, afterTs, cap) {
            const rows = await sql<
                {
                    endpoint: string;
                    status: number;
                    latency_ms: number;
                    ts: string | number;
                }[]
            >`
                SELECT endpoint, status, latency_ms, ts
                FROM api_request_events
                WHERE project_id = ${projectId} AND ts > ${afterTs}
                ORDER BY ts ASC
                LIMIT ${cap}
            `;
            return rows.map(row => ({
                endpoint: row.endpoint,
                status: Number(row.status),
                latencyMs: Number(row.latency_ms),
                ts: toNumber(row.ts),
            }));
        },

        async countActiveKeysUsedSince(projectId, sinceMs) {
            const rows = await sql<{ count: string }[]>`
                SELECT count(*) AS count
                FROM api_keys
                WHERE project_id = ${projectId}
                  AND revoked_at IS NULL
                  AND last_used_at >= ${sinceMs}
            `;
            return Number(rows[0]?.count ?? 0);
        },
    };
}
