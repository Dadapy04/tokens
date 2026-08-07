import { describe, expect, it } from 'bun:test';
import { Effect } from 'effect';

import { resolveAssetRefContext } from './_resolve-asset-ref';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const TESLA_XSTOCK_MINT = 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB';
const UNKNOWN_MINT = '11111111111111111111111111111111';

describe('resolveAssetRefContext', () => {
    it('resolves singleton-style USDC mint refs to the USD asset group', async () => {
        const result = await Effect.runPromise(resolveAssetRefContext(`solana-${USDC_MINT}`));

        expect(result.assetId).toBe('usd');
        expect(result.ref).toBe(`solana-${USDC_MINT}`);
        expect(result.resolvedBy).toBe('singletonMint');
        expect(result.mint).toBe(USDC_MINT);
    });

    it('resolves tokenized equity mints to their equity asset group', async () => {
        const result = await Effect.runPromise(resolveAssetRefContext(TESLA_XSTOCK_MINT));

        expect(result.assetId).toBe('tesla');
        expect(result.resolvedBy).toBe('mint');
        expect(result.mint).toBe(TESLA_XSTOCK_MINT);
    });

    it('keeps unknown mints as deterministic singleton assets', async () => {
        const result = await Effect.runPromise(resolveAssetRefContext(UNKNOWN_MINT));

        expect(result.assetId).toBe(`solana-${UNKNOWN_MINT}`);
        expect(result.resolvedBy).toBe('singleton');
        expect(result.mint).toBe(UNKNOWN_MINT);
    });
});
