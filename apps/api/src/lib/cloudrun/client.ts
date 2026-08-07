/**
 * HTTP client for the GCP Cloud Run services (see `terraform/modules/cloud_run/`).
 */

export type CloudRunService = 'assets' | 'prices' | 'usage' | 'admin';

export type CloudRunCallKind = 'query' | 'mutation';

export interface CloudRunCallerIdentity {
    clerkUserId: string;
    projectId?: string;
}

export interface CloudRunCallOptions {
    identity?: CloudRunCallerIdentity;
    /** Per-call timeout override in ms. Defaults to the client-level timeout (15s). */
    timeoutMs?: number;
    /**
     * Retries on retryable failures (timeout, network error, HTTP 5xx) after
     * the first attempt. Defaults to 0 (no retry). Honored only for queries —
     * mutations are never retried, since they may not be safe to replay.
     */
    maxRetries?: number;
    /** Base delay between retry attempts in ms (grows linearly, plus jitter). Defaults to 150. */
    retryDelayMs?: number;
}

export const CLOUDRUN_IDENTITY_HEADER = 'x-tokens-identity';

export function encodeCallerIdentity(identity: CloudRunCallerIdentity): string {
    const json = JSON.stringify(identity);
    return Buffer.from(json, 'utf8').toString('base64');
}

export interface CloudRunClientConfig {
    /** Per-service base URLs (Cloud Run service URLs or LB-fronted hostnames). */
    baseUrls: Partial<Record<CloudRunService, string>>;
    /** Bearer token sent in the `Authorization` header. */
    authToken: string;
    /** Per-request timeout. Defaults to 15s. */
    timeoutMs?: number;
    /** Override the global `fetch` (test injection). */
    fetch?: typeof fetch;
}

export class CloudRunCallError extends Error {
    readonly callName: string;

    constructor(
        message: string,
        readonly service: CloudRunService,
        readonly kind: CloudRunCallKind,
        callName: string,
        readonly status?: number,
        readonly body?: string,
    ) {
        super(message);
        this.name = 'CloudRunCallError';
        this.callName = callName;
    }
}

export class CloudRunClient {
    private readonly fetchImpl: typeof fetch;
    private readonly timeoutMs: number;

    constructor(private readonly cfg: CloudRunClientConfig) {
        this.fetchImpl = cfg.fetch ?? fetch;
        this.timeoutMs = cfg.timeoutMs ?? 15_000;
    }

    query<TResult = unknown>(
        service: CloudRunService,
        name: string,
        args: Record<string, unknown> = {},
        options: CloudRunCallOptions = {},
    ): Promise<TResult> {
        return this.call<TResult>(service, 'query', name, args, options);
    }

    mutation<TResult = unknown>(
        service: CloudRunService,
        name: string,
        args: Record<string, unknown> = {},
        options: CloudRunCallOptions = {},
    ): Promise<TResult> {
        return this.call<TResult>(service, 'mutation', name, args, options);
    }

    private async call<T>(
        service: CloudRunService,
        kind: CloudRunCallKind,
        name: string,
        args: Record<string, unknown>,
        options: CloudRunCallOptions,
    ): Promise<T> {
        const base = this.cfg.baseUrls[service];
        if (!base) {
            throw new CloudRunCallError(
                `CloudRunClient: no base URL configured for service '${service}'`,
                service,
                kind,
                name,
            );
        }
        // Mutations are never retried regardless of options — replaying a
        // non-idempotent call is worse than failing it.
        const maxRetries = kind === 'query' ? Math.max(0, options.maxRetries ?? 0) : 0;
        const retryDelayMs = Math.max(0, options.retryDelayMs ?? 150);

        let lastError: CloudRunCallError;
        for (let attempt = 0; ; attempt++) {
            try {
                return await this.callOnce<T>(base, service, kind, name, args, options);
            } catch (err) {
                // callOnce only ever throws CloudRunCallError.
                lastError = err as CloudRunCallError;
                // Timeouts and network failures have no status; upstream 5xx is
                // transient-shaped. 4xx is caller/data-dependent — do not retry.
                const retryable = lastError.status === undefined || lastError.status >= 500;
                if (!retryable || attempt >= maxRetries) throw lastError;
                // Jitter de-synchronizes retries across concurrent callers so a
                // shared upstream blip doesn't turn into a thundering herd.
                const jitter = Math.random() * retryDelayMs * 0.5;
                await new Promise(resolve => setTimeout(resolve, retryDelayMs * (attempt + 1) + jitter));
            }
        }
    }

    private async callOnce<T>(
        base: string,
        service: CloudRunService,
        kind: CloudRunCallKind,
        name: string,
        args: Record<string, unknown>,
        options: CloudRunCallOptions,
    ): Promise<T> {
        const url = `${base.replace(/\/$/, '')}/${kind}/${encodeURIComponent(name)}`;
        const timeoutMs = options.timeoutMs ?? this.timeoutMs;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const headers: Record<string, string> = {
            'content-type': 'application/json',
            authorization: `Bearer ${this.cfg.authToken}`,
            'accept-encoding': 'gzip, deflate',
        };
        if (options.identity) {
            headers[CLOUDRUN_IDENTITY_HEADER] = encodeCallerIdentity(options.identity);
        }
        try {
            const res = await this.fetchImpl(url, {
                method: 'POST',
                signal: controller.signal,
                headers,
                body: JSON.stringify(args),
            });
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                throw new CloudRunCallError(
                    `CloudRun ${kind} ${service}.${name} failed: HTTP ${res.status}`,
                    service,
                    kind,
                    name,
                    res.status,
                    body.slice(0, 1024),
                );
            }
            return (await res.json()) as T;
        } catch (err) {
            if (err instanceof CloudRunCallError) throw err;
            if (err instanceof Error && err.name === 'AbortError') {
                throw new CloudRunCallError(
                    `CloudRun ${kind} ${service}.${name} timed out after ${timeoutMs}ms`,
                    service,
                    kind,
                    name,
                );
            }
            throw new CloudRunCallError(
                `CloudRun ${kind} ${service}.${name} threw: ${String(err)}`,
                service,
                kind,
                name,
            );
        } finally {
            clearTimeout(timeout);
        }
    }
}

let cached: CloudRunClient | null = null;

/**
 * Returns the singleton CloudRunClient. Cloud Run is the only backend.
 *
 * Required env:
 * - TOKENS_CLOUDRUN_AUTH_TOKEN
 * - TOKENS_CLOUDRUN_{ASSETS,PRICES,USAGE}_URL
 *
 * Optional:
 * - TOKENS_CLOUDRUN_ADMIN_URL
 * - TOKENS_CLOUDRUN_TIMEOUT_MS (default 15000)
 */
export function getCloudRunClient(): CloudRunClient {
    if (cached) return cached;
    const adminUrl = process.env.TOKENS_CLOUDRUN_ADMIN_URL?.trim();
    const baseUrls: Partial<Record<CloudRunService, string>> = {
        assets: requireEnv('TOKENS_CLOUDRUN_ASSETS_URL'),
        prices: requireEnv('TOKENS_CLOUDRUN_PRICES_URL'),
        usage: requireEnv('TOKENS_CLOUDRUN_USAGE_URL'),
        ...(adminUrl ? { admin: adminUrl } : {}),
    };
    const timeout = Number(process.env.TOKENS_CLOUDRUN_TIMEOUT_MS) || undefined;
    cached = new CloudRunClient({
        baseUrls,
        authToken: requireEnv('TOKENS_CLOUDRUN_AUTH_TOKEN'),
        timeoutMs: timeout,
    });
    return cached;
}

/** Test helper — reset the singleton between tests that toggle env vars. */
export function __resetCloudRunClientForTesting() {
    cached = null;
}

function requireEnv(name: string): string {
    const v = process.env[name]?.trim();
    if (!v) throw new Error(`CloudRun client: missing required env var ${name}`);
    return v;
}
