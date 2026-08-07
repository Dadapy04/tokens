/**
 * Port of `convex/adminAuth.ts`.
 *
 * Convex read the allowlist from `process.env` and threw a generic
 * `Error('Unauthorized')`. Here the allowlist raw string is injected (wired
 * from `TOKENS_ADMIN_CLERK_USER_IDS` in index.ts) so handlers are testable,
 * and failures map to the dispatcher's 401/403 statuses:
 * - no caller identity → IdentityRequiredError (401)
 * - identity not on the allowlist → UnauthorizedError (403)
 */

import { IdentityRequiredError, UnauthorizedError } from './handlers/errors';
import type { CallerIdentity } from './server';

export function parseAdminClerkUserIds(raw: string | null | undefined): ReadonlySet<string> {
    const values = (raw ?? '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
    return new Set(values);
}

export function isAdminClerkUserId(
    adminClerkUserIds: ReadonlySet<string>,
    clerkUserId: string | null | undefined,
): boolean {
    if (!clerkUserId) return false;
    return adminClerkUserIds.has(clerkUserId.trim());
}

export function requireAdmin(
    adminClerkUserIds: ReadonlySet<string>,
    identity: CallerIdentity | null,
): { clerkUserId: string } {
    if (!identity) throw new IdentityRequiredError();
    const clerkUserId = identity.clerkUserId.trim();
    if (!clerkUserId || !isAdminClerkUserId(adminClerkUserIds, clerkUserId)) {
        throw new UnauthorizedError('Unauthorized');
    }
    return { clerkUserId };
}
