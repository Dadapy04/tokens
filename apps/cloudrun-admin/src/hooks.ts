/**
 * `POST /hooks/gcp-logs`: Cloud Logging -> Pub/Sub push consumer, forwards
 * LogEntries to Grafana Loki. Lives on the admin service (IAM-locked, no
 * user-facing traffic) so log ingestion can never contend with the API-key
 * auth path on the usage service — Pub/Sub's OIDC identity is enforced by
 * Cloud Run IAM first and re-verified here.
 */

import type { Hono } from 'hono';

import { OidcAuthError, type VerifyOidc } from './oidc';

export interface GcpLogsHookDeps {
    lokiPushUrl?: string;
    lokiPushAuth?: string;
    /** Verifies the Google OIDC token Pub/Sub attaches to push deliveries. */
    verifyGcpLogsOidc?: VerifyOidc;
    /** Env label attached to Loki streams. */
    envLabel?: string;
    fetchImpl?: typeof fetch;
}

type LokiStream = {
    stream: Record<string, string>;
    values: Array<[string, string]>;
};

function tsNs(ms: number): string {
    return `${BigInt(Math.floor(Number.isFinite(ms) ? ms : Date.now())) * 1_000_000n}`;
}

export type LokiPushResult = 'pushed' | 'rejected' | 'retryable';

/**
 * 4xx from Loki means the entry is permanently unshippable (too-old
 * timestamp, bad labels) — retrying can never succeed, so callers must ACK.
 * Only 5xx/network errors are retryable. Without this distinction, one
 * unshippable message NACK-loops through Pub/Sub forever.
 */
export async function pushToLoki(deps: GcpLogsHookDeps, streams: LokiStream[]): Promise<LokiPushResult> {
    const lokiUrl = deps.lokiPushUrl;
    const lokiAuth = deps.lokiPushAuth;
    if (!lokiUrl || !lokiAuth) {
        console.error('loki: LOKI_PUSH_URL / LOKI_PUSH_AUTH unset');
        return 'retryable';
    }
    if (streams.length === 0 || streams.every(s => s.values.length === 0)) return 'pushed';
    const fetchImpl = deps.fetchImpl ?? fetch;
    let res: Response;
    try {
        res = await fetchImpl(lokiUrl, {
            method: 'POST',
            headers: { Authorization: lokiAuth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ streams }),
        });
    } catch (err) {
        console.error(`loki: push threw ${err instanceof Error ? err.message : 'unknown'}`);
        return 'retryable';
    }
    if (res.ok) return 'pushed';
    const body = await res.text().catch(() => '');
    console.error(`loki: push failed status=${res.status} body=${body.slice(0, 300)}`);
    return res.status >= 400 && res.status < 500 ? 'rejected' : 'retryable';
}

export function registerGcpLogsRoute(app: Hono, deps: GcpLogsHookDeps): void {
    const envLabel = deps.envLabel ?? 'prd';

    app.post('/hooks/gcp-logs', async c => {
        const verify = deps.verifyGcpLogsOidc;
        if (!verify) return c.text('server misconfigured', 500);
        const authz = c.req.header('authorization') ?? '';
        const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
        if (!token) return c.text('unauthorized', 401);
        try {
            await verify(token);
        } catch (err) {
            if (err instanceof OidcAuthError) return c.text('forbidden', 403);
            console.error('[hooks/gcp-logs] verify threw', err);
            return c.text('unauthorized', 401);
        }

        // Pub/Sub push envelope: { message: { data: base64(LogEntry JSON) } }.
        let envelope: { message?: { data?: string } };
        try {
            envelope = (await c.req.json()) as { message?: { data?: string } };
        } catch {
            return c.text('bad json', 400);
        }
        const data = envelope.message?.data;
        if (!data) return c.body(null, 204);

        let entry: Record<string, unknown>;
        try {
            entry = JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as Record<string, unknown>;
        } catch {
            // Never NACK unparseable entries: Pub/Sub would redeliver them forever.
            return c.body(null, 204);
        }

        const resource = entry.resource as { labels?: Record<string, string> } | undefined;
        const service = resource?.labels?.service_name ?? 'gcp-unknown';
        const severity = typeof entry.severity === 'string' ? entry.severity : 'DEFAULT';
        const tsMs = Date.parse(typeof entry.timestamp === 'string' ? entry.timestamp : '') || Date.now();
        const line =
            typeof entry.textPayload === 'string'
                ? entry.textPayload
                : JSON.stringify(entry.jsonPayload ?? entry.protoPayload ?? entry.httpRequest ?? entry);

        const result = await pushToLoki(deps, [
            {
                stream: { service, env: envLabel, source: 'gcp', severity },
                values: [[tsNs(tsMs), line]],
            },
        ]);
        // 'rejected' entries are ACKed (204): Loki will never accept them.
        return c.body(null, result === 'retryable' ? 502 : 204);
    });
}
