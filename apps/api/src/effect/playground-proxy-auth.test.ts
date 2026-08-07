import { describe, expect, it } from 'bun:test';

import { signPlaygroundProxyAuthPayload, verifyPlaygroundProxyAuthHeader } from './playground-proxy-auth';

const ORIGINAL_SECRET = process.env.TOKENS_PLAYGROUND_PROXY_SECRET;

describe('playground proxy auth', () => {
    function setSecret(): void {
        process.env.TOKENS_PLAYGROUND_PROXY_SECRET = 'test-playground-secret';
    }

    function restoreSecret(): void {
        if (ORIGINAL_SECRET === undefined) delete process.env.TOKENS_PLAYGROUND_PROXY_SECRET;
        else process.env.TOKENS_PLAYGROUND_PROXY_SECRET = ORIGINAL_SECRET;
    }

    it('verifies a valid signed payload', async () => {
        setSecret();
        try {
            const token = await signPlaygroundProxyAuthPayload({
                apiKeyId: 'key123',
                keyPrefix: 'tok_abc',
                projectId: 'project123',
                ownerClerkUserId: 'user123',
                scopes: ['assets:read'],
                iat: Date.now(),
                exp: Date.now() + 60_000,
            });

            const payload = await verifyPlaygroundProxyAuthHeader(token);
            expect(payload?.apiKeyId).toBe('key123');
            expect(payload?.projectId).toBe('project123');
            expect(JSON.stringify(payload?.scopes)).toBe(JSON.stringify(['assets:read']));
        } finally {
            restoreSecret();
        }
    });

    it('rejects tampered payloads', async () => {
        setSecret();
        try {
            const token = await signPlaygroundProxyAuthPayload({
                apiKeyId: 'key123',
                keyPrefix: 'tok_abc',
                projectId: 'project123',
                ownerClerkUserId: 'user123',
                scopes: ['assets:read'],
                iat: Date.now(),
                exp: Date.now() + 60_000,
            });

            const [payload, signature] = token.split('.');
            const tampered = `${payload?.replace(/.$/, 'x')}.${signature}`;

            expect(await verifyPlaygroundProxyAuthHeader(tampered)).toBe(null);
        } finally {
            restoreSecret();
        }
    });

    it('rejects expired payloads', async () => {
        setSecret();
        try {
            const token = await signPlaygroundProxyAuthPayload({
                apiKeyId: 'key123',
                keyPrefix: 'tok_abc',
                projectId: 'project123',
                ownerClerkUserId: 'user123',
                scopes: ['assets:read'],
                iat: Date.now() - 120_000,
                exp: Date.now() - 60_000,
            });

            expect(await verifyPlaygroundProxyAuthHeader(token)).toBe(null);
        } finally {
            restoreSecret();
        }
    });
});
