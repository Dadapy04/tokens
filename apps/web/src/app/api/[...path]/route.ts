import { proxyPlatformError, proxyPlatformGet, proxyPlatformRequest } from '../_platform-proxy';

function shouldUseCachedProxy(request: Request): boolean {
    if (request.method.toUpperCase() !== 'GET') return false;

    let url: URL;
    try {
        url = new URL(request.url);
    } catch {
        return false;
    }

    const pathname = url.pathname;

    // High-traffic, read-only endpoints where a 60s cache drastically reduces upstream load.
    if (pathname === '/api/coingecko/ohlcv') return true;
    if (pathname.startsWith('/api/token/')) return true;

    return false;
}

async function handle(request: Request): Promise<Response> {
    try {
        const url = new URL(request.url);
        // Only proxy the explicitly-allowed CoinGecko routes.
        // (The rest are intentionally blocked from the public web app.)
        if (
            url.pathname.startsWith('/api/coingecko/') &&
            url.pathname !== '/api/coingecko/ohlcv' &&
            url.pathname !== '/api/coingecko/news'
        ) {
            return Response.json(
                {
                    error: {
                        _tag: 'NotFoundError',
                        message: 'Not Found',
                    },
                },
                {
                    status: 404,
                },
            );
        }
        if (url.pathname.startsWith('/api/x/') && url.pathname !== '/api/x/tokens-feed') {
            return Response.json(
                {
                    error: {
                        _tag: 'NotFoundError',
                        message: 'Not Found',
                    },
                },
                {
                    status: 404,
                },
            );
        }
        return shouldUseCachedProxy(request) ? await proxyPlatformGet(request) : await proxyPlatformRequest(request);
    } catch (error) {
        return proxyPlatformError(error);
    }
}

export async function GET(request: Request): Promise<Response> {
    return await handle(request);
}

export async function POST(request: Request): Promise<Response> {
    return await handle(request);
}

export async function PUT(request: Request): Promise<Response> {
    return await handle(request);
}

export async function PATCH(request: Request): Promise<Response> {
    return await handle(request);
}

export async function DELETE(request: Request): Promise<Response> {
    return await handle(request);
}

export async function HEAD(request: Request): Promise<Response> {
    return await handle(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
    return await handle(request);
}
