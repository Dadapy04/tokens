export function buildXProfileUrl(screenName: string): string | null {
    const trimmed = screenName.trim().replace(/^@+/, '');
    return trimmed.length > 0 ? `https://x.com/${encodeURIComponent(trimmed)}` : null;
}
