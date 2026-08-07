import { describe, expect, it } from 'bun:test';

import { isAdminClerkUserId, parseAdminClerkUserIds, requireAdmin } from './adminAuth';
import { IdentityRequiredError, UnauthorizedError } from './handlers/errors';

describe('parseAdminClerkUserIds', () => {
    it('splits on commas, trims, and drops empties', () => {
        const ids = parseAdminClerkUserIds(' user_a , user_b,,  ,user_c ');
        expect([...ids].sort()).toEqual(['user_a', 'user_b', 'user_c']);
    });

    it('returns an empty set for undefined/empty input', () => {
        expect(parseAdminClerkUserIds(undefined).size).toBe(0);
        expect(parseAdminClerkUserIds('').size).toBe(0);
    });
});

describe('isAdminClerkUserId', () => {
    const ids = parseAdminClerkUserIds('user_a,user_b');

    it('matches trimmed ids', () => {
        expect(isAdminClerkUserId(ids, 'user_a')).toBe(true);
        expect(isAdminClerkUserId(ids, ' user_b ')).toBe(true);
        expect(isAdminClerkUserId(ids, 'user_c')).toBe(false);
        expect(isAdminClerkUserId(ids, null)).toBe(false);
        expect(isAdminClerkUserId(ids, undefined)).toBe(false);
        expect(isAdminClerkUserId(ids, '')).toBe(false);
    });
});

describe('requireAdmin', () => {
    const ids = parseAdminClerkUserIds('user_a');

    it('throws IdentityRequiredError when no identity was forwarded', () => {
        expect(() => requireAdmin(ids, null)).toThrow(IdentityRequiredError);
    });

    it('throws UnauthorizedError for a non-allowlisted caller', () => {
        expect(() => requireAdmin(ids, { clerkUserId: 'user_z' })).toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when the allowlist is empty', () => {
        expect(() => requireAdmin(new Set<string>(), { clerkUserId: 'user_a' })).toThrow(UnauthorizedError);
    });

    it('returns the trimmed clerkUserId for an admin caller', () => {
        expect(requireAdmin(ids, { clerkUserId: ' user_a ' })).toEqual({ clerkUserId: 'user_a' });
    });
});
