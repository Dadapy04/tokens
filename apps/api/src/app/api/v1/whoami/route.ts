import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { logApiError, logHttpRequest } from '@/lib/http-metrics';

export async function GET(request: Request): Promise<Response> {
    // Deliberate session-authenticated exception: this route reports the current Clerk user
    // and does not participate in platform API-key auth.
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const pathname = new URL(request.url).pathname;
    const { isAuthenticated, tokenType, userId, sessionId } = await auth();
    const isUserSession = tokenType === 'session_token';

    if (!isAuthenticated || !isUserSession || !userId) {
        const response = NextResponse.json(
            { error: { _tag: 'UnauthorizedError', message: 'Unauthorized' } },
            { status: 401, headers: { 'Cache-Control': 'no-store', 'x-request-id': requestId } },
        );
        const durationMs = Date.now() - startedAt;

        logHttpRequest({
            requestId,
            method: request.method,
            path: pathname,
            status: response.status,
            durationMs,
            source: 'route',
            authType: 'clerk_session',
            authFailure: true,
        });
        logApiError({
            requestId,
            method: request.method,
            path: pathname,
            status: response.status,
            durationMs,
            errorType: 'UnauthorizedError',
            source: 'route',
            authType: 'clerk_session',
            authFailure: true,
        });

        return response;
    }

    const user = await currentUser();
    const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;
    const response = NextResponse.json(
        {
            userId,
            sessionId: sessionId ?? null,
            primaryEmail,
        },
        { headers: { 'Cache-Control': 'no-store', 'x-request-id': requestId } },
    );

    logHttpRequest({
        requestId,
        method: request.method,
        path: pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
        source: 'route',
        authType: 'clerk_session',
    });

    return response;
}
