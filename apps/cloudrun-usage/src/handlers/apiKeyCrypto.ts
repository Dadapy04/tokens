/**
 * API-key generation, hashing, and reveal encryption.
 *
 * Verbatim port of the crypto in `convex/apiKeyActions.ts`. The encryption
 * secret MUST be byte-identical to the one Convex used
 * (`TOKENS_API_KEY_ENCRYPTION_SECRET`), or reveal of migrated keys fails:
 *
 * - raw key: `tok_<64 hex chars>` (32 random bytes)
 * - lookup hash: SHA-256(rawKey), lowercase hex
 * - reveal encryption: AES-GCM-256, key = SHA-256(secret), 12-byte random IV,
 *   ciphertext + IV base64-encoded, `version: 1`
 */

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export function generateRawApiKey(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return `tok_${toHex(bytes)}`;
}

export async function sha256Hex(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return toHex(new Uint8Array(digest));
}

export function keyPrefixFromRawKey(rawKey: string): string {
    return rawKey.trim().slice(0, 8);
}

function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
    const binary = atob(value);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function getAesKey(secret: string): Promise<CryptoKey> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
    return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export interface EncryptedRawApiKey {
    encryptedRawKeyCiphertext: string;
    encryptedRawKeyIv: string;
    encryptedRawKeyVersion: number;
    encryptedRawKeyCreatedAt: number;
}

export async function encryptRawApiKey(
    rawKey: string,
    secret: string,
    nowMs: number = Date.now(),
): Promise<EncryptedRawApiKey> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getAesKey(secret);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(rawKey));
    return {
        encryptedRawKeyCiphertext: toBase64(new Uint8Array(encrypted)),
        encryptedRawKeyIv: toBase64(iv),
        encryptedRawKeyVersion: 1,
        encryptedRawKeyCreatedAt: nowMs,
    };
}

export async function decryptRawApiKey(
    params: { ciphertext: string; iv: string; version: number },
    secret: string,
): Promise<string> {
    if (params.version !== 1) throw new Error(`Unsupported encrypted API key version: ${params.version}`);
    const key = await getAesKey(secret);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(params.iv) },
        key,
        fromBase64(params.ciphertext),
    );
    return new TextDecoder().decode(decrypted);
}
