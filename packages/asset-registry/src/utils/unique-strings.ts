export function uniqueStrings(values: string[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();

    for (const value of values) {
        const trimmed = value.trim();
        if (!trimmed) continue;
        if (seen.has(trimmed)) continue;
        seen.add(trimmed);
        out.push(trimmed);
    }

    return out;
}
