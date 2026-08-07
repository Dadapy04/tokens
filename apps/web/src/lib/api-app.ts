import 'server-only';

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };
const LOCAL_API_ORIGIN = 'http://localhost:3002';

function getApiOrigin(): string {
    const raw = process.env.API_BASE_URL?.trim() ?? process.env.TOKENS_API_ORIGIN?.trim() ?? '';
    if (raw) return raw.replace(/\/$/, '');
    if (process.env.NODE_ENV !== 'production') return LOCAL_API_ORIGIN;

    throw new Error('API_BASE_URL or TOKENS_API_ORIGIN must be set in production');
}

function requirePlatformServiceKey(): string {
    const key = process.env.TOKENS_PLATFORM_API_KEY?.trim();
    if (!key) {
        throw new Error('TOKENS_PLATFORM_API_KEY is not set (required for server-to-server API calls)');
    }
    return key;
}

function joinUrl(origin: string, path: string): string {
    const base = origin.endsWith('/') ? origin : `${origin}/`;
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${normalized}`;
}

async function readJsonOrThrow(res: Response): Promise<unknown> {
    const text = await res.text().catch(() => '');
    if (!text) return null;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new Error(`Expected JSON but received: ${text.slice(0, 200)}`);
    }
}

export async function fetchApiApp(path: string, init?: NextFetchInit): Promise<Response> {
    const platformKey = requirePlatformServiceKey();
    const url = joinUrl(getApiOrigin(), path);
    const headers = new Headers(init?.headers);
    headers.set('accept', 'application/json');
    headers.set('x-api-key', platformKey);

    return await fetch(url, {
        ...init,
        headers,
    });
}

export async function fetchApiAppJson<T>(path: string, init?: NextFetchInit): Promise<T> {
    const res = await fetchApiApp(path, init);
    const json = await readJsonOrThrow(res);

    if (!res.ok) {
        const message =
            json && typeof json === 'object' ? JSON.stringify(json) : `${res.status} ${res.statusText}`.trim();
        throw new Error(message);
    }

    return json as T;
}

export async function fetchApiAppJsonOrNull<T>(path: string, init?: NextFetchInit): Promise<T | null> {
    try {
        return await fetchApiAppJson<T>(path, init);
    } catch {
        return null;
    }
}
