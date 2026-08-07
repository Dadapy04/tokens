// The assets API absolutizes its curated /logos/* assets against its own
// origin. In production those are public https URLs the image optimizer can
// fetch, but in dev they point at a loopback host (e.g.
// http://localhost:3002/logos/popular/solana.png) and next/image refuses to
// fetch upstream images that resolve to private IPs. Rewrite loopback logo
// URLs to relative paths: files in our own public dir are served directly,
// and the rest are proxied to the API by the dev-only `/logos/:path*` rewrite
// in next.config.ts.

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function normalizeLogoSrc(src: string): string;
export function normalizeLogoSrc(src: string | undefined): string | undefined;
export function normalizeLogoSrc(src: string | undefined): string | undefined {
    if (!src || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) return src;

    try {
        const url = new URL(src);
        if (url.pathname.startsWith('/logos/') && LOOPBACK_HOSTNAMES.has(url.hostname)) {
            return `${url.pathname}${url.search}`;
        }
    } catch {
        // Not an absolute URL — leave as-is.
    }

    return src;
}
