export function looksLikeSolanaMintAddress(value: string): boolean {
    // Base58 (no 0,O,I,l) and common Solana mint length range.
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}
