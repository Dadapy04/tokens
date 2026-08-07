import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { isAdminClerkUserId } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/** Replaces the Convex `adminCuratedTokens.isAdmin` query — answered locally from the allowlist. */
export async function GET() {
    const session = await auth();
    return NextResponse.json({ isAdmin: Boolean(session.userId && isAdminClerkUserId(session.userId)) });
}
