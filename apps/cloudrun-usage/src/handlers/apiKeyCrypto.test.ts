import { describe, expect, it } from 'bun:test';

import {
    decryptRawApiKey,
    encryptRawApiKey,
    generateRawApiKey,
    keyPrefixFromRawKey,
    sha256Hex,
} from './apiKeyCrypto';

const SECRET = 'test-encryption-secret';

describe('generateRawApiKey', () => {
    it('produces tok_<64 hex> keys', () => {
        const key = generateRawApiKey();
        expect(/^tok_[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it('produces unique keys', () => {
        expect(generateRawApiKey()).not.toBe(generateRawApiKey());
    });
});

describe('sha256Hex', () => {
    it('matches a known vector', async () => {
        // echo -n "abc" | shasum -a 256
        expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
});

describe('keyPrefixFromRawKey', () => {
    it('returns the first 8 chars, trimmed', () => {
        expect(keyPrefixFromRawKey('  tok_abcdef123 ')).toBe('tok_abcd');
    });
});

describe('encryptRawApiKey / decryptRawApiKey', () => {
    it('round-trips', async () => {
        const rawKey = generateRawApiKey();
        const encrypted = await encryptRawApiKey(rawKey, SECRET, 1_750_000_000_000);
        expect(encrypted.encryptedRawKeyVersion).toBe(1);
        expect(encrypted.encryptedRawKeyCreatedAt).toBe(1_750_000_000_000);
        const decrypted = await decryptRawApiKey(
            {
                ciphertext: encrypted.encryptedRawKeyCiphertext,
                iv: encrypted.encryptedRawKeyIv,
                version: encrypted.encryptedRawKeyVersion,
            },
            SECRET,
        );
        expect(decrypted).toBe(rawKey);
    });

    it('uses a fresh IV each time', async () => {
        const a = await encryptRawApiKey('tok_same', SECRET);
        const b = await encryptRawApiKey('tok_same', SECRET);
        expect(a.encryptedRawKeyIv).not.toBe(b.encryptedRawKeyIv);
        expect(a.encryptedRawKeyCiphertext).not.toBe(b.encryptedRawKeyCiphertext);
    });

    it('rejects unsupported versions', async () => {
        const encrypted = await encryptRawApiKey('tok_x', SECRET);
        await expect(
            decryptRawApiKey(
                { ciphertext: encrypted.encryptedRawKeyCiphertext, iv: encrypted.encryptedRawKeyIv, version: 2 },
                SECRET,
            ),
        ).rejects.toThrow('Unsupported encrypted API key version');
    });

    it('fails to decrypt with a different secret', async () => {
        const encrypted = await encryptRawApiKey('tok_x', SECRET);
        await expect(
            decryptRawApiKey(
                {
                    ciphertext: encrypted.encryptedRawKeyCiphertext,
                    iv: encrypted.encryptedRawKeyIv,
                    version: 1,
                },
                'wrong-secret',
            ),
        ).rejects.toThrow();
    });
});
