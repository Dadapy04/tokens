import type { AssetCategory, AssetVariant, CanonicalAsset, TrustTier, VariantKind, VariantMatch } from './types';
import { CANONICAL_ASSETS } from './data/index';
import { MINT_HOME_OVERRIDES } from './data/mint-home-overrides';

function normalizeQuery(value: string): string {
    return value.trim().toLowerCase();
}

const ASSETS: CanonicalAsset[] = CANONICAL_ASSETS;

const ASSET_BY_ID = new Map<string, CanonicalAsset>(ASSETS.map(asset => [asset.assetId, asset]));
const ASSET_BY_COINGECKO_ID = new Map<string, CanonicalAsset>(
    ASSETS.flatMap(asset => (asset.coingeckoId ? [[asset.coingeckoId, asset] as const] : [])),
);

const ASSET_BY_ALIAS = new Map<string, CanonicalAsset>();

// Variant matching (mint → hub) is hub-first, deterministic, and warns on duplicates.
const VARIANT_MATCHES_BY_MINT = new Map<string, VariantMatch[]>();
for (const asset of ASSETS) {
    for (const variant of asset.variants) {
        const matches = VARIANT_MATCHES_BY_MINT.get(variant.mint);
        if (matches) {
            matches.push({ asset, variant });
        } else {
            VARIANT_MATCHES_BY_MINT.set(variant.mint, [{ asset, variant }]);
        }
    }
}

export interface RegistryIssue {
    kind: 'ambiguous_mint' | 'alias_collision';
    mint?: string;
    override?: string | null;
    alias?: string;
    candidates: string[];
    message: string;
}

const REGISTRY_ISSUES: RegistryIssue[] = [];
const REGISTRY_ISSUE_KEYS = new Set<string>();

function issueKey(issue: RegistryIssue): string {
    if (issue.kind === 'ambiguous_mint') return `${issue.kind}:${issue.mint ?? ''}:${issue.candidates.join(',')}`;
    return `${issue.kind}:${issue.alias ?? ''}:${issue.candidates.join(',')}`;
}

function pushRegistryIssue(issue: RegistryIssue): void {
    const key = issueKey(issue);
    if (REGISTRY_ISSUE_KEYS.has(key)) return;
    REGISTRY_ISSUE_KEYS.add(key);
    REGISTRY_ISSUES.push(issue);
}

function shouldLogRegistryIssues(): boolean {
    const env = (globalThis as any).process?.env as Record<string, string | undefined> | undefined;
    const nodeEnv = (env?.NODE_ENV ?? '').trim();
    return nodeEnv !== 'production';
}

function sortVariantMatches(matches: ReadonlyArray<VariantMatch>): VariantMatch[] {
    return matches.slice().sort((a, b) => {
        const byAssetId = a.asset.assetId.localeCompare(b.asset.assetId);
        if (byAssetId) return byAssetId;
        const byVariantId = (a.variant.variantId ?? '').localeCompare(b.variant.variantId ?? '');
        if (byVariantId) return byVariantId;
        return a.variant.mint.localeCompare(b.variant.mint);
    });
}

const VARIANT_BY_MINT = new Map<string, VariantMatch>();
for (const [mint, matches] of VARIANT_MATCHES_BY_MINT.entries()) {
    if (matches.length === 1) {
        VARIANT_BY_MINT.set(mint, matches[0]!);
        continue;
    }

    const override = (MINT_HOME_OVERRIDES[mint] ?? '').trim();
    const candidateIds = matches.map(m => m.asset.assetId);
    const selected = override ? matches.find(m => m.asset.assetId === override) : undefined;
    if (!selected) {
        const message = [
            'Ambiguous mint: appears in multiple canonical assets.',
            `mint=${mint}`,
            `override=${override || '(missing)'}`,
            `candidates=${candidateIds.join(',')}`,
            'Fix: add a home hub assetId to `packages/asset-registry/src/data/mint-home-overrides.ts`.',
        ].join(' | ');
        pushRegistryIssue({
            kind: 'ambiguous_mint',
            mint,
            override: override || null,
            candidates: candidateIds.slice(),
            message,
        });
        VARIANT_BY_MINT.set(mint, sortVariantMatches(matches)[0]!);
        continue;
    }

    VARIANT_BY_MINT.set(mint, selected);
}

export function validateRegistry(
    opts: { throwOnError?: boolean } = {},
): { ok: true } | { ok: false; issues: RegistryIssue[] } {
    if (REGISTRY_ISSUES.length === 0) return { ok: true };
    if (opts.throwOnError) throw new Error(REGISTRY_ISSUES.map(i => i.message).join('\n'));
    return { ok: false, issues: REGISTRY_ISSUES.slice() };
}

// Build aliases in two passes so mint aliases always match the selected mint → hub mapping.
function registerAlias(alias: string, asset: CanonicalAsset): void {
    const normalized = normalizeQuery(alias);
    if (!normalized) return;

    const existing = ASSET_BY_ALIAS.get(normalized);
    if (existing && existing.assetId !== asset.assetId) {
        pushRegistryIssue({
            kind: 'alias_collision',
            alias: normalized,
            candidates: [existing.assetId, asset.assetId].sort(),
            message: [
                'Alias collision: multiple canonical assets share the same alias.',
                `alias=${normalized}`,
                `candidates=${[existing.assetId, asset.assetId].sort().join(',')}`,
            ].join(' | '),
        });
        return;
    }

    if (!existing) ASSET_BY_ALIAS.set(normalized, asset);
}

for (const asset of ASSETS) {
    const aliasCandidates = [
        asset.assetId,
        asset.name ?? '',
        asset.symbol ?? '',
        asset.coingeckoId ?? '',
        ...asset.aliases,
    ];

    for (const alias of aliasCandidates) {
        registerAlias(alias, asset);
    }
}

for (const match of VARIANT_BY_MINT.values()) {
    const asset = match.asset;
    const variant = match.variant;

    const aliasCandidates = [variant.mint, variant.variantId, variant.symbol ?? '', variant.name ?? ''];
    for (const alias of aliasCandidates) {
        registerAlias(alias, asset);
    }
}

export function getAsset(assetId: string): CanonicalAsset | null {
    return ASSET_BY_ID.get(assetId) ?? null;
}

export function getAssetByCoingeckoId(coingeckoId: string): CanonicalAsset | null {
    return ASSET_BY_COINGECKO_ID.get(coingeckoId) ?? null;
}

export function listAssets(): CanonicalAsset[] {
    return ASSETS;
}

export function listCategories(): AssetCategory[] {
    const unique = new Set<AssetCategory>();
    for (const asset of ASSETS) unique.add(asset.category);
    return Array.from(unique).sort();
}

export function listAssetsByCategory(category: AssetCategory): CanonicalAsset[] {
    return ASSETS.filter(asset => asset.category === category);
}

export function resolveAlias(alias: string): CanonicalAsset | null {
    const normalized = normalizeQuery(alias);
    if (!normalized) return null;
    return ASSET_BY_ALIAS.get(normalized) ?? null;
}

export function searchAssets(query: string, opts: { category?: AssetCategory; limit?: number } = {}): CanonicalAsset[] {
    const q = normalizeQuery(query);
    if (!q) return [];

    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
    const category = opts.category;

    const results: CanonicalAsset[] = [];
    for (const asset of ASSETS) {
        if (category && asset.category !== category) continue;

        const haystack = [
            asset.assetId,
            asset.name ?? '',
            asset.symbol ?? '',
            asset.coingeckoId ?? '',
            ...asset.aliases,
            ...asset.variants.flatMap(v => [v.mint, v.variantId, v.symbol ?? '', v.name ?? '', v.label ?? '']),
        ]
            .join(' ')
            .toLowerCase();

        if (!haystack.includes(q)) continue;
        results.push(asset);
        if (results.length >= limit) break;
    }

    return results;
}

export function getVariants(assetId: string, opts: { kind?: VariantKind; trustTier?: TrustTier } = {}): AssetVariant[] {
    const asset = getAsset(assetId);
    if (!asset) return [];

    const kind = opts.kind;
    const trustTier = opts.trustTier;

    return asset.variants.filter(v => {
        if (kind && v.kind !== kind) return false;
        if (trustTier && v.trustTier !== trustTier) return false;
        return true;
    });
}

export function getVariantByMint(mint: string): VariantMatch | null {
    return VARIANT_BY_MINT.get(mint) ?? null;
}

export function listVariantMatchesByMint(mint: string): VariantMatch[] {
    return (VARIANT_MATCHES_BY_MINT.get(mint) ?? []).slice();
}
