import { looksLikeSolanaMintAddress } from '@/lib/solana-address';

export function normalizeOptionalText(value: string | undefined | null): string {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return '';
    if (trimmed === '—') return '';
    if (trimmed === '???') return '';
    return trimmed;
}

export function pickFirstSymbol(...values: Array<string | undefined | null>): string {
    for (const value of values) {
        const cleaned = normalizeOptionalText(value);
        if (!cleaned) continue;
        if (looksLikeSolanaMintAddress(cleaned)) continue;
        return cleaned;
    }
    return '';
}

export function pickFirstDisplayName(...values: Array<string | undefined | null>): string {
    for (const value of values) {
        const cleaned = normalizeOptionalText(value);
        if (!cleaned) continue;
        if (looksLikeSolanaMintAddress(cleaned)) continue;
        return cleaned;
    }
    return '';
}
