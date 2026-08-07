import { InvalidArgsError } from './assets';

export interface AssetDeletionTombstonesRepo {
    findDeletedNormalizedRefs(normalizedRefs: readonly string[]): Promise<string[]>;
}

function normalizeRef(ref: string): string {
    return ref.trim().toLowerCase();
}

function uniqueNormalizedRefs(refs: readonly string[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const ref of refs) {
        const normalized = normalizeRef(ref);
        if (!normalized) continue;
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        out.push(normalized);
    }
    return out;
}

export async function listDeletedRefs(
    repo: AssetDeletionTombstonesRepo,
    args: unknown,
): Promise<string[]> {
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    const a = args as { refs?: unknown };
    if (!Array.isArray(a.refs)) {
        throw new InvalidArgsError('refs must be an array of strings');
    }
    for (const item of a.refs) {
        if (typeof item !== 'string') {
            throw new InvalidArgsError('refs must be an array of strings');
        }
    }
    const normalizedRefs = uniqueNormalizedRefs(a.refs as string[]).slice(0, 2000);
    if (normalizedRefs.length === 0) return [];
    return repo.findDeletedNormalizedRefs(normalizedRefs);
}
