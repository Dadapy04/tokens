import { describe, expect, it } from 'bun:test';

import { pickBestTokenizedCoinId, type CoinGeckoCoinSearchResult } from './_resolve-coingecko-coin-id';

function coin(partial: Partial<CoinGeckoCoinSearchResult> & Pick<CoinGeckoCoinSearchResult, 'id' | 'name' | 'symbol'>) {
    return {
        platforms: {},
        ...partial,
    } satisfies CoinGeckoCoinSearchResult;
}

describe('pickBestTokenizedCoinId', () => {
    it('prefers Ondo tokenized match for Verizon', () => {
        const coins: CoinGeckoCoinSearchResult[] = [
            coin({ id: 'verizon-xstock', name: 'Verizon xStock', symbol: 'VZX' }),
            coin({ id: 'verizon-ondo-tokenized', name: 'Verizon (Ondo Tokenized)', symbol: 'VZON' }),
        ];

        expect(pickBestTokenizedCoinId(coins, { name: 'Verizon', symbol: 'VZ' })).toBe('verizon-ondo-tokenized');
    });

    it('handles Ondo ids that include -stock suffix', () => {
        const coins: CoinGeckoCoinSearchResult[] = [
            coin({ id: 'airbnb-ondo-tokenized-stock', name: 'Airbnb (Ondo Tokenized Stock)', symbol: 'ABNBON' }),
        ];

        expect(pickBestTokenizedCoinId(coins, { name: 'Airbnb', symbol: 'ABNB' })).toBe('airbnb-ondo-tokenized-stock');
    });

    it('does not select unrelated non-tokenized coins', () => {
        const coins: CoinGeckoCoinSearchResult[] = [
            coin({ id: 'amc', name: 'AMC', symbol: 'AMC' }),
            coin({
                id: 'amc-entertainment-ondo-tokenized-stocks',
                name: 'AMC Entertainment (Ondo Tokenized Stock)',
                symbol: 'AMCON',
            }),
        ];

        expect(pickBestTokenizedCoinId(coins, { name: 'AMC Entertainment', symbol: 'AMC' })).toBe(
            'amc-entertainment-ondo-tokenized-stocks',
        );
    });
});
