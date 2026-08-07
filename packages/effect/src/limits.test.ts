import { describe, expect, it } from 'bun:test';
import { Effect } from 'effect';

import { decodeLimit, decodeOffset } from './limits';

describe('limits', () => {
    it('uses the default limit', async () => {
        const value = await Effect.runPromise(decodeLimit(null, { defaultValue: '20', max: 50 }));
        expect(value).toBe(20);
    });

    it('clamps limits to the configured max', async () => {
        const value = await Effect.runPromise(decodeLimit('500', { defaultValue: '20', max: 50 }));
        expect(value).toBe(50);
    });

    it('rejects invalid limits', async () => {
        let failed = false;
        try {
            await Effect.runPromise(decodeLimit('nope', { defaultValue: '20', max: 50 }));
        } catch (error) {
            failed = String(error).includes('Invalid limit');
        }
        expect(failed).toBe(true);
    });

    it('rejects invalid offsets', async () => {
        let failed = false;
        try {
            await Effect.runPromise(decodeOffset('-1'));
        } catch (error) {
            failed = String(error).includes('Invalid offset');
        }
        expect(failed).toBe(true);
    });
});
