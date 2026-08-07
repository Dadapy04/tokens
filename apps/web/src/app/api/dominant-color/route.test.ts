import { describe, expect, test } from 'bun:test';

import { GET } from './route';

describe('/api/dominant-color', () => {
    test('computes a color for local public logos without remote host validation', async () => {
        const response = await GET(
            new Request('http://localhost:3000/api/dominant-color?url=%2Flogos%2Fpopular%2Fbitcoin.png&v=6'),
        );

        expect(response.status).toBe(200);

        const body = (await response.json()) as { color: string | null };
        expect(typeof body.color === 'string' && /^#[0-9a-f]{6}$/i.test(body.color)).toBe(true);
    });
});
