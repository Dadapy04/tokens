import { NextResponse } from 'next/server';

import { logHttpRequest } from '@/lib/http-metrics';

export function GET(request: Request): Response {
    // Deliberate public exception: health checks stay outside the shared API-key wrapper.
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const response = NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store', 'x-request-id': requestId } },
    );

    const pathname = new URL(request.url).pathname;
    logHttpRequest({
        requestId,
        method: request.method,
        path: pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
        source: 'route',
        authType: 'public',
    });

    return response;
}
