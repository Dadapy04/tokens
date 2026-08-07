export interface SearchParamsLike {
    get(name: string): string | null;
}

export function normalizeRedirectUrlComplete(raw: string | null): string {
    if (!raw) return '/';
    const trimmed = raw.trim();
    if (!trimmed) return '/';

    if (trimmed.startsWith('/')) return trimmed;

    try {
        const url = new URL(trimmed);
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return '/';
    }
}

export function getRedirectUrlComplete(searchParams: SearchParamsLike): string {
    // Clerk uses `redirect_url` when redirecting via `redirectToSignIn`.
    const raw = searchParams.get('redirect_url');
    return normalizeRedirectUrlComplete(raw);
}
