import { describe, expect, it } from 'bun:test';
import { buildXProfileUrl } from './social-links';

describe('buildXProfileUrl', () => {
    it('normalizes non-empty handles to x.com URLs', () => {
        expect(buildXProfileUrl(' tokens ')).toBe('https://x.com/tokens');
        expect(buildXProfileUrl('@tokens')).toBe('https://x.com/tokens');
    });

    it('rejects empty handles', () => {
        expect(buildXProfileUrl('   ')).toBe(null);
    });
});
