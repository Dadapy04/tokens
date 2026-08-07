import { describe, expect, test } from 'bun:test';

import { CURATED_TOKEN_ADDED_AT } from './curated-token-added-at';
import { getLatestAddedToken } from './curated-latest-added';
import { CURATED_TOKEN_LISTS, type CuratedTokenList } from './curated-token-lists';

describe('curated token added-at coverage', () => {
    test('every curated address has a generated added-at entry', () => {
        const missing: string[] = [];
        for (const list of Object.values(CURATED_TOKEN_LISTS)) {
            for (const address of list.addresses) {
                if (CURATED_TOKEN_ADDED_AT[address] === undefined) missing.push(`${list.id}: ${address}`);
            }
        }

        expect(
            missing,
            `Addresses missing from curated-token-added-at.ts — regenerate it with:\n` +
                `  bun scripts/generate-curated-token-added-at.ts\n(after committing the new addresses)`,
        ).toEqual([]);
    });
});

describe('getLatestAddedToken', () => {
    const list = (addresses: string[]): CuratedTokenList => ({
        id: 'test',
        name: 'Test',
        description: 'test',
        addresses,
    });

    test('picks the address with the highest addedAt regardless of array order', () => {
        const result = getLatestAddedToken(list(['newest', 'middle', 'oldest']), {
            newest: 300,
            middle: 200,
            oldest: 100,
        });
        expect(result).toEqual({ address: 'newest', addedAt: 300 });
    });

    test('treats addresses missing from the map as newest', () => {
        const result = getLatestAddedToken(list(['known', 'just-added']), { known: 999 });
        expect(result).toEqual({ address: 'just-added', addedAt: null });
    });

    test('breaks timestamp ties by later array position', () => {
        const result = getLatestAddedToken(list(['a', 'b', 'c']), { a: 100, b: 100, c: 50 });
        expect(result).toEqual({ address: 'b', addedAt: 100 });
    });

    test('returns null for an empty list', () => {
        expect(getLatestAddedToken(list([]), {})).toBeNull();
    });
});
