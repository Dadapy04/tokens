import { describe, expect, test } from 'bun:test';

import { buildCacheControl } from './cache-control';

describe('buildCacheControl', () => {
    test('defaults to no-store when no policy is set', () => {
        expect(buildCacheControl(undefined)).toBe('no-store');
    });

    test('defaults visibility to private', () => {
        expect(buildCacheControl({ maxAge: 60 })).toBe('private, max-age=60');
    });

    test('includes stale-while-revalidate when set', () => {
        expect(buildCacheControl({ maxAge: 300, staleWhileRevalidate: 600 })).toBe(
            'private, max-age=300, stale-while-revalidate=600',
        );
    });

    test('supports explicit public + s-maxage', () => {
        expect(buildCacheControl({ visibility: 'public', maxAge: 60, sMaxAge: 120 })).toBe(
            'public, max-age=60, s-maxage=120',
        );
    });
});
