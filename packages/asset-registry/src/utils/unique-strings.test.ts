import { describe, expect, test } from 'bun:test';
import { uniqueStrings } from './unique-strings';

describe('uniqueStrings', () => {
    test('trims, drops empty strings, and preserves first occurrence order', () => {
        expect(uniqueStrings(['  a ', '', 'b', 'a', '  b  ', 'A'])).toEqual(['a', 'b', 'A']);
    });
});
