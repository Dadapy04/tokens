import 'server-only';

/**
 * Admin allowlist (mirror of `convex/adminAuth.ts`). The same
 * `TOKENS_ADMIN_CLERK_USER_IDS` env gates three layers: this Next.js proxy,
 * cloudrun-admin, and the admin mutations on cloudrun-assets.
 */

export function parseAdminClerkUserIds(raw: string | undefined = process.env.TOKENS_ADMIN_CLERK_USER_IDS): Set<string> {
    const out = new Set<string>();
    for (const part of (raw ?? '').split(',')) {
        const trimmed = part.trim();
        if (trimmed) out.add(trimmed);
    }
    return out;
}

export function isAdminClerkUserId(clerkUserId: string | null | undefined): boolean {
    if (!clerkUserId) return false;
    return parseAdminClerkUserIds().has(clerkUserId);
}
