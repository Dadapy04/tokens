/**
 * Effective Clerk user resolution (email aliasing).
 *
 * 1:1 port of `convex/clerkIdentity.ts`. When the same person has multiple
 * Clerk user records sharing a primary email (e.g. after an auth-provider
 * migration), every user-context handler resolves the "effective" user by
 * scoring candidates on activity and picking the busiest account:
 *
 *   score = activeKeys * 1000 + keys * 100 + memberships
 *
 * The caller's own ID wins ties (strict `>` comparison, caller scored first).
 *
 * SQL note: Convex looked up `by_primaryEmail` with the lowercased email
 * against exact stored values; the Postgres repo uses
 * `WHERE lower(primary_email) = <normalized>` — a slightly safer widening.
 */

export interface IdentityRepo {
    /** Primary email of the given user row, or null if no row / no email. */
    getUserPrimaryEmail(clerkUserId: string): Promise<string | null>;
    /** Distinct clerkUserIds of user rows whose primary email matches (case-insensitive). */
    listClerkUserIdsByEmail(email: string): Promise<string[]>;
    /** Raw activity counts used for candidate scoring. */
    getIdentityScoreInputs(clerkUserId: string): Promise<{ memberships: number; keys: number; activeKeys: number }>;
}

export function normalizeEmail(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : null;
}

async function scoreClerkUserId(repo: IdentityRepo, clerkUserId: string): Promise<number> {
    const { memberships, keys, activeKeys } = await repo.getIdentityScoreInputs(clerkUserId);
    return activeKeys * 1000 + keys * 100 + memberships;
}

export async function resolveEffectiveClerkUserId(
    repo: IdentityRepo,
    clerkUserId: string,
    email?: string | null,
): Promise<string> {
    const normalizedEmail = normalizeEmail(email) ?? normalizeEmail(await repo.getUserPrimaryEmail(clerkUserId));
    if (!normalizedEmail) return clerkUserId;

    const candidates = await repo.listClerkUserIdsByEmail(normalizedEmail);
    if (candidates.length === 0) return clerkUserId;
    if (candidates.length === 1) return candidates[0] ?? clerkUserId;

    let best = clerkUserId;
    let bestScore = await scoreClerkUserId(repo, clerkUserId);

    for (const candidate of candidates) {
        const score = await scoreClerkUserId(repo, candidate);
        if (score > bestScore) {
            best = candidate;
            bestScore = score;
        }
    }

    return best;
}
