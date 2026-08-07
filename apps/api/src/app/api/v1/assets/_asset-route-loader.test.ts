import { describe, expect, it } from 'bun:test';
import { Effect } from 'effect';

import { selectMintFromRequest, toCanonicalAsset, toCanonicalVariants } from './_asset-route-loader';

const MINT_A = 'So11111111111111111111111111111111111111112';
const MINT_B = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkYtvdQ7BPP3Qz1n';

describe('asset route loader helpers', () => {
    it('builds canonical assets from DB rows', () => {
        const canonical = toCanonicalAsset(
            {
                assetId: 'spacex',
                name: 'SpaceX',
                symbol: 'SPCX',
                category: 'equity',
                aliases: ['spcx'],
                coingeckoId: 'solana',
                updatedAt: 0,
            } as Parameters<typeof toCanonicalAsset>[0],
            toCanonicalVariants([
                {
                    assetId: 'spacex',
                    chain: 'solana',
                    mint: MINT_A,
                    variantId: 'spacex:xstock',
                    kind: 'tokenized_equity',
                    trustTier: 'tier1',
                    stockVariantTier: 'cash_redeemable',
                    tags: ['equity'],
                    createdAt: 0,
                    updatedAt: 0,
                } as Parameters<typeof toCanonicalVariants>[0][number],
            ]),
        );

        expect(canonical.assetId).toBe('spacex');
        expect(canonical.variants.length).toBe(1);
        expect(canonical.variants[0]?.mint).toBe(MINT_A);
        expect(canonical.variants[0]?.stockVariantTier).toBe('cash_redeemable');
    });

    it('selects the requested mint when it belongs to the asset', async () => {
        const request = new Request(`https://api.test/api/v1/assets/solana?mint=${MINT_B}`);
        const canonical = {
            assetId: 'solana',
            category: 'crypto' as const,
            aliases: [],
            variants: [
                { variantId: 'a', mint: MINT_A, kind: 'native' as const, trustTier: 'tier1' as const, tags: [] },
                { variantId: 'b', mint: MINT_B, kind: 'stablecoin' as const, trustTier: 'tier2' as const, tags: [] },
            ],
        };

        const selected = await Effect.runPromise(
            selectMintFromRequest(request, canonical, canonical.variants[0] ?? null),
        );
        expect(selected.selectedMint).toBe(MINT_B);
        expect(selected.selectedVariant.variantId).toBe('b');
    });

    it('selects the path-derived mint when no query mint is provided', async () => {
        const request = new Request('https://api.test/api/v1/assets/solana-some-mint');
        const canonical = {
            assetId: 'solana',
            category: 'crypto' as const,
            aliases: [],
            variants: [
                { variantId: 'a', mint: MINT_A, kind: 'native' as const, trustTier: 'tier1' as const, tags: [] },
                { variantId: 'b', mint: MINT_B, kind: 'stablecoin' as const, trustTier: 'tier2' as const, tags: [] },
            ],
        };

        const selected = await Effect.runPromise(
            selectMintFromRequest(request, canonical, canonical.variants[0] ?? null, { defaultMint: MINT_B }),
        );
        expect(selected.selectedMint).toBe(MINT_B);
        expect(selected.selectedVariant.variantId).toBe('b');
    });

    it('lets query mint override the path-derived mint', async () => {
        const request = new Request(`https://api.test/api/v1/assets/solana-some-mint?mint=${MINT_A}`);
        const canonical = {
            assetId: 'solana',
            category: 'crypto' as const,
            aliases: [],
            variants: [
                { variantId: 'a', mint: MINT_A, kind: 'native' as const, trustTier: 'tier1' as const, tags: [] },
                { variantId: 'b', mint: MINT_B, kind: 'stablecoin' as const, trustTier: 'tier2' as const, tags: [] },
            ],
        };

        const selected = await Effect.runPromise(
            selectMintFromRequest(request, canonical, canonical.variants[0] ?? null, { defaultMint: MINT_B }),
        );
        expect(selected.selectedMint).toBe(MINT_A);
        expect(selected.selectedVariant.variantId).toBe('a');
    });

    it('fails when no primary variant exists', async () => {
        const request = new Request('https://api.test/api/v1/assets/empty');
        const canonical = { assetId: 'empty', category: 'crypto' as const, aliases: [], variants: [] };

        let failed = false;
        try {
            await Effect.runPromise(selectMintFromRequest(request, canonical, null));
        } catch (error) {
            failed = String(error).includes('No primary variant available');
        }
        expect(failed).toBe(true);
    });

    it('returns BadRequestError when required mint is missing', async () => {
        const request = new Request('https://api.test/api/v1/assets/solana');
        const canonical = {
            assetId: 'solana',
            category: 'crypto' as const,
            aliases: [],
            variants: [
                { variantId: 'a', mint: MINT_A, kind: 'native' as const, trustTier: 'tier1' as const, tags: [] },
            ],
        };

        try {
            await Effect.runPromise(
                selectMintFromRequest(request, canonical, canonical.variants[0] ?? null, { requireMint: true }),
            );
            throw new Error('Expected selectMintFromRequest to fail');
        } catch (error) {
            const message = String(error);
            expect(message.includes('BadRequestError')).toBe(true);
            expect(message.includes('`mint` query parameter is required')).toBe(true);
        }
    });
});
