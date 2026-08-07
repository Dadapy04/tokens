/**
 * Tests for the transactional SQL helpers using a recording fake `tx`:
 * atomic per-kind alias replacement (DELETE + INSERT with priorities) and
 * collection sync with in-tx `COALESCE(MAX(rank), -1) + 1` rank computation.
 */

import { describe, expect, it } from 'bun:test';

import type { TransactionSql } from 'postgres';

import { replaceAliasesForKind, replaceCustomAliases, syncCollections } from './curatedTokensMutations';

interface RecordedQuery {
    text: string;
    params: unknown[];
}

function makeFakeTx(): { tx: TransactionSql; queries: RecordedQuery[] } {
    const queries: RecordedQuery[] = [];
    const tx = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
        queries.push({ text: strings.join('$'), params: values });
        return [];
    }) as unknown as TransactionSql;
    return { tx, queries };
}

const NOW = 1_750_000_000_000;

describe('replaceAliasesForKind', () => {
    it('deletes the kind and inserts the alias with the right priority + normalized form', async () => {
        const { tx, queries } = makeFakeTx();
        await replaceAliasesForKind(tx, { assetId: 'bitcoin', kind: 'name', alias: 'Bitcoin', nowMs: NOW });
        expect(queries).toHaveLength(2);
        expect(queries[0]!.text).toContain('DELETE FROM asset_aliases');
        expect(queries[0]!.params).toEqual(['bitcoin', 'name']);
        expect(queries[1]!.text).toContain('INSERT INTO asset_aliases');
        // (id, normalized, alias, assetId, kind, priority, created, updated)
        const [, normalized, alias, assetId, kind, priority] = queries[1]!.params;
        expect(normalized).toBe('bitcoin');
        expect(alias).toBe('Bitcoin');
        expect(assetId).toBe('bitcoin');
        expect(kind).toBe('name');
        expect(priority).toBe(900);
    });

    it('uses priority 800 for symbol and 700 for coingeckoId', async () => {
        const { tx, queries } = makeFakeTx();
        await replaceAliasesForKind(tx, { assetId: 'a', kind: 'symbol', alias: 'BTC', nowMs: NOW });
        await replaceAliasesForKind(tx, { assetId: 'a', kind: 'coingeckoId', alias: 'bitcoin', nowMs: NOW });
        expect(queries[1]!.params[5]).toBe(800);
        expect(queries[3]!.params[5]).toBe(700);
    });

    it('only deletes when the alias is null (cleared)', async () => {
        const { tx, queries } = makeFakeTx();
        await replaceAliasesForKind(tx, { assetId: 'a', kind: 'symbol', alias: null, nowMs: NOW });
        expect(queries).toHaveLength(1);
        expect(queries[0]!.text).toContain('DELETE FROM asset_aliases');
    });
});

describe('replaceCustomAliases', () => {
    it('replaces atomically: one DELETE, then inserts with priority 500, deduped by lowercase', async () => {
        const { tx, queries } = makeFakeTx();
        await replaceCustomAliases(tx, { assetId: 'bitcoin', aliases: ['BTC', 'btc', 'Digital Gold'], nowMs: NOW });
        expect(queries[0]!.text).toContain('DELETE FROM asset_aliases');
        expect(queries[0]!.params).toEqual(['bitcoin']);
        const inserts = queries.slice(1);
        expect(inserts).toHaveLength(2); // 'btc' case-duplicate is dropped
        expect(inserts.map(q => q.params[1])).toEqual(['btc', 'digital gold']); // normalized
        expect(inserts.map(q => q.params[2])).toEqual(['BTC', 'Digital Gold']); // original alias
        for (const insert of inserts) {
            // 'custom' kind is a SQL literal, so priority sits at params[4] here.
            expect(insert.params[4]).toBe(500);
        }
    });

    it('deletes everything when the alias list is empty', async () => {
        const { tx, queries } = makeFakeTx();
        await replaceCustomAliases(tx, { assetId: 'bitcoin', aliases: [], nowMs: NOW });
        expect(queries).toHaveLength(1);
        expect(queries[0]!.text).toContain('DELETE FROM asset_aliases');
    });
});

describe('syncCollections', () => {
    it('deletes non-requested slugs and inserts requested ones at COALESCE(MAX(rank),-1)+1 in-tx', async () => {
        const { tx, queries } = makeFakeTx();
        await syncCollections(tx, { assetId: 'bitcoin', collections: ['majors', 'stocks'], nowMs: NOW });

        // One statement per curated slug, in canonical slug order.
        expect(queries).toHaveLength(6);
        // Both DELETE and INSERT carry the slug at params[1].
        const bySlug = new Map(queries.map(q => [q.params[1] as string, q]));

        const insertMajors = queries[0]!;
        expect(insertMajors.text).toContain('INSERT INTO asset_collection_members');
        expect(insertMajors.text).toContain('COALESCE(MAX(rank), -1) + 1');
        expect(insertMajors.text).toContain('WHERE NOT EXISTS');
        expect(insertMajors.params[1]).toBe('majors');
        expect(insertMajors.params[2]).toBe('bitcoin');
        expect(insertMajors.params[4]).toBe(NOW); // added_at epoch ms

        const insertStocks = queries[5]!;
        expect(insertStocks.text).toContain('INSERT INTO asset_collection_members');
        expect(insertStocks.params[1]).toBe('stocks');

        for (const slug of ['currencies', 'rwas', 'etfs', 'metals']) {
            const q = bySlug.get(slug);
            expect(q?.text).toContain('DELETE FROM asset_collection_members');
            expect(q?.params[0]).toBe('bitcoin');
            expect(q?.params[1]).toBe(slug);
        }
    });

    it('removes all curated memberships when the requested set is empty', async () => {
        const { tx, queries } = makeFakeTx();
        await syncCollections(tx, { assetId: 'bitcoin', collections: [], nowMs: NOW });
        expect(queries).toHaveLength(6);
        for (const q of queries) {
            expect(q.text).toContain('DELETE FROM asset_collection_members');
        }
    });
});
