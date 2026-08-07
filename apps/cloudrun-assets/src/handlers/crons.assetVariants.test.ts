import { describe, expect, it } from 'bun:test';

import type { AssetVariantDocRow, AssetVariantsRepo } from './assetVariants';
import {
    refreshSolanaDefaultVariantsView,
    type AssetVariantsCronDeps,
} from './crons.assetVariants';

const FIXED_NOW = 1_780_000_000_000;

function makeVariant(overrides: Partial<AssetVariantDocRow> = {}): AssetVariantDocRow {
    return {
        asset_id: 'solana',
        chain: 'solana',
        mint: 'mintA',
        variant_id: 'solana:solana:mintA',
        kind: 'native',
        trust_tier: 'tier1',
        stock_variant_tier: null,
        tags: [],
        issuer: null,
        issuer_url: null,
        label: null,
        is_active: true,
        created_at: FIXED_NOW - 1000,
        updated_at: FIXED_NOW - 1000,
        ...overrides,
    };
}

interface State {
    activeVariants?: AssetVariantDocRow[];
    upserted?: { variantsJson: string; updatedAt: number }[];
}

function makeRepo(state: State = {}): AssetVariantsRepo {
    state.upserted ??= [];
    return {
        async findVariantByMint() { return null; },
        async findVariantsByMints() { return []; },
        async findVariantsByAssetIds() { return []; },
        async findActiveSolanaVariants() { return state.activeVariants ?? []; },
        async findAssetIsActive() { return null; },
        async findSolanaDefaultVariantsView() { return null; },
        async upsertSolanaDefaultVariantsView(args) {
            state.upserted!.push(args);
        },
        async findVariantMarketsByMints() { return []; },
        async findTokenMarketsByMints() { return []; },
    };
}

function makeDeps(repo: AssetVariantsRepo): AssetVariantsCronDeps {
    return { assetVariantsRepo: repo, now: () => FIXED_NOW };
}

describe('refreshSolanaDefaultVariantsView', () => {
    it('builds an empty variants view when no active variants', async () => {
        const state: State = { activeVariants: [] };
        const result = await refreshSolanaDefaultVariantsView(makeDeps(makeRepo(state)), {});
        expect(result.ok).toBe(true);
        expect(result.processed).toBe(0);
        expect(state.upserted).toHaveLength(1);
        const row = state.upserted![0]!;
        expect(JSON.parse(row.variantsJson)).toEqual([]);
        expect(row.updatedAt).toBe(FIXED_NOW);
    });

    it('builds and persists a variants view with active variants', async () => {
        const state: State = {
            activeVariants: [
                makeVariant({ mint: 'mintA', variant_id: 'solana:solana:mintA' }),
                makeVariant({ mint: 'mintB', variant_id: 'solana:solana:mintB', kind: 'wrapped' }),
            ],
        };
        const result = await refreshSolanaDefaultVariantsView(makeDeps(makeRepo(state)), {});
        expect(result.ok).toBe(true);
        expect(result.processed).toBe(2);
        expect(state.upserted).toHaveLength(1);
        const parsed = JSON.parse(state.upserted![0]!.variantsJson) as Array<{ mint: string }>;
        expect(parsed.map(v => v.mint).sort()).toEqual(['mintA', 'mintB']);
    });

    it('ignores extraneous args', async () => {
        const state: State = { activeVariants: [makeVariant()] };
        const result = await refreshSolanaDefaultVariantsView(
            makeDeps(makeRepo(state)),
            { unexpectedField: 'ignored' },
        );
        expect(result.ok).toBe(true);
        expect(state.upserted).toHaveLength(1);
    });
});
