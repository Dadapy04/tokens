import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { callCloudRunUsage, CloudRunCallError } from '@/lib/cloudrun';
import { DASHBOARD_FNS } from '@/lib/dashboard-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSessionEmail(session: Awaited<ReturnType<typeof auth>>): string | undefined {
    const claims = session.sessionClaims as Record<string, unknown> | null | undefined;
    const raw = claims?.email ?? claims?.primary_email ?? claims?.primaryEmail;
    return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ fn: string }> }) {
    const { fn } = await ctx.params;
    const spec = DASHBOARD_FNS[fn];
    if (!spec) {
        return NextResponse.json({ error: { message: `Unknown dashboard function: ${fn}` } }, { status: 404 });
    }

    const session = await auth();
    if (!session.userId) {
        return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
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

        // upsertMe needs the caller's profile, which session claims may lack.
        if (fn === 'usersUpsertMe') {
            const user = await currentUser().catch(() => null);
            const fullName = user?.fullName?.trim() || undefined;
            const primaryEmail =
                user?.primaryEmailAddress?.emailAddress?.trim() || email || undefined;
            args = {
                ...args,
                ...(primaryEmail ? { email: primaryEmail } : {}),
                ...(fullName ? { fullName } : {}),
            };
        }

        const result = await callCloudRunUsage(spec.kind, fn, args, {
            clerkUserId: session.userId,
            ...(email ? { email } : {}),
        });
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof CloudRunCallError && (error.status === 401 || error.status === 403)) {
            return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: error.status });
        }
        console.error(`[dashboard-proxy] ${fn} failed`, error);
        const message = error instanceof Error ? error.message : 'Dashboard request failed';
        return NextResponse.json({ error: { message } }, { status: 502 });
    }
}
