import 'server-only';

/**
 * Minimal Cloud Run client for the admin app (admin + assets services).
 * Bearer token + base64 `x-tokens-identity` header carrying the
 * Clerk-session-verified caller. Same wire contract as apps/api's client.
 */

export interface CloudRunCallerIdentity {
    clerkUserId: string;
    email?: string;
}

const SERVICE_URL_ENV: Record<'admin' | 'assets', string> = {
    admin: 'TOKENS_CLOUDRUN_ADMIN_URL',
    assets: 'TOKENS_CLOUDRUN_ASSETS_URL',
};

export class CloudRunCallError extends Error {
    constructor(
        message: string,
        readonly service: string,
        readonly callName: string,
        readonly status?: number,
        readonly body?: string,
    ) {
        super(message);
        this.name = 'CloudRunCallError';
    }
}

function requireEnv(name: string): string {
    const v = process.env[name]?.trim();
    if (!v) throw new Error(`CloudRun client: missing required env var ${name}`);
    return v;
}

export async function callCloudRun<T>(
    service: 'admin' | 'assets',
    kind: 'query' | 'mutation',
    name: string,
    args: Record<string, unknown>,
    identity: CloudRunCallerIdentity,
    timeoutMs = 15_000,
): Promise<T> {
    const base = requireEnv(SERVICE_URL_ENV[service]).replace(/\/$/, '');
    const authToken = requireEnv('TOKENS_CLOUDRUN_AUTH_TOKEN');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(`${base}/${kind}/${encodeURIComponent(name)}`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${authToken}`,
                'x-tokens-identity': Buffer.from(JSON.stringify(identity), 'utf8').toString('base64'),
            },
            body: JSON.stringify(args),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new CloudRunCallError(
                `CloudRun ${kind} ${service}.${name} failed: HTTP ${res.status}`,
                service,
                name,
                res.status,
                body.slice(0, 1024),
            );
        }
        return (await res.json()) as T;
    } catch (err) {
        if (err instanceof CloudRunCallError) throw err;
        if (err instanceof Error && err.name === 'AbortError') {
            throw new CloudRunCallError(`CloudRun ${kind} ${service}.${name} timed out after ${timeoutMs}ms`, service, name);
        }
        throw new CloudRunCallError(`CloudRun ${kind} ${service}.${name} threw: ${String(err)}`, service, name);
    } finally {
        clearTimeout(timeout);
    }
}
