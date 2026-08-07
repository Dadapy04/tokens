import 'server-only';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isAdminClerkUserId } from '@/lib/admin-auth';
import { ADMIN_FNS } from '@/lib/admin-fns';
import { callCloudRun, CloudRunCallError } from '@/lib/cloudrun';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSessionEmail(session: Awaited<ReturnType<typeof auth>>): string | undefined {
    const claims = session.sessionClaims as Record<string, unknown> | null | undefined;
    const raw = claims?.email ?? claims?.primary_email ?? claims?.primaryEmail;
    return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ name: string }> }) {
    const { name } = await ctx.params;
    const spec = ADMIN_FNS[name];
    if (!spec) {
        return NextResponse.json({ error: { message: `Unknown admin function: ${name}` } }, { status: 404 });
    }

    const session = await auth();
    if (!session.userId) {
        return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }
    if (!isAdminClerkUserId(session.userId)) {
        return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
    }

    let args: Record<string, unknown>;
    try {
        const body: unknown = await request.json().catch(() => ({}));
        args = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    } catch {
        args = {};
    }

    try {
        const email = getSessionEmail(session);
        const result = await callCloudRun(
            spec.service,
            spec.kind,
            name,
            args,
            { clerkUserId: session.userId, ...(email ? { email } : {}) },
            spec.timeoutMs ?? 15_000,
        );
        return NextResponse.json(result ?? null);
    } catch (error) {
        if (error instanceof CloudRunCallError) {
            if (error.status === 401 || error.status === 403) {
                return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: error.status });
            }
            if (error.status === 400) {
                // Surface handler validation messages (Convex threw human-readable errors the dialogs show).
                let message = 'Invalid request';
                try {
                    const parsed = JSON.parse(error.body ?? '{}') as { message?: string };
                    if (parsed.message) message = parsed.message;
                } catch {
                    // keep default
                }
                return NextResponse.json({ error: { message } }, { status: 400 });
            }
        }
        console.error(`[admin-proxy] ${name} failed`, error);
        return NextResponse.json({ error: { message: 'Admin request failed' } }, { status: 502 });
    }
}
