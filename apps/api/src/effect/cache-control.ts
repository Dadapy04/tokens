/**
 * HTTP cache policy for successful responses.
 *
 * IMPORTANT: every v1 route is authenticated via `x-api-key`, and shared
 * caches do not vary on that header by default — so policies default to
 * `private` (browser-only caching). Do not use `public`/`s-maxage` until the
 * CDN is configured to key its cache on the API key.
 */
export interface CachePolicy {
    visibility?: 'private' | 'public';
    /** max-age in seconds. */
    maxAge: number;
    /** s-maxage in seconds (shared caches) — only meaningful with `public`. */
    sMaxAge?: number;
    /** stale-while-revalidate in seconds. */
    staleWhileRevalidate?: number;
}

export function buildCacheControl(policy: CachePolicy | undefined): string {
    if (!policy) return 'no-store';
    const parts = [policy.visibility ?? 'private', `max-age=${policy.maxAge}`];
    if (policy.sMaxAge !== undefined) parts.push(`s-maxage=${policy.sMaxAge}`);
    if (policy.staleWhileRevalidate !== undefined) {
        parts.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
    }
    return parts.join(', ');
}
