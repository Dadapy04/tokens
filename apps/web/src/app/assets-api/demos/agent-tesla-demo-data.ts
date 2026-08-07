import { getTokenLogoURLForMintWithSecondarySymbol } from '@/lib/logo-overrides';

export type Tier = 'tier1' | 'tier2' | 'tier3';

export interface UnsafeCandidate {
    symbol: string;
    displaySymbol: string;
    name: string;
    shortMint: string;
    marketCapLabel: string;
    volumeLabel: string;
    liquidityLabel: string;
    organicScoreLabel: string;
}

export interface GuardedCandidate {
    symbol: string;
    name: string;
    mint: string;
    shortMint: string;
    label?: string;
    liquidityTier: Tier;
    trustTier: Tier;
    liquidityLabel: string;
    volumeLabel: string;
    marketCapLabel: string;
    logoUrl: string;
}

export interface AgentTeslaDemoViewModel {
    task: {
        prompt: string;
        notionalLabel: string;
    };
    unsafe: {
        searchSurface: 'Jupiter-like search';
        candidates: UnsafeCandidate[];
        selected: UnsafeCandidate | null;
        decisionReason: string;
        riskSummary: string;
    };
    guarded: {
        searchPath: string;
        variantsPath: string;
        assetId: string;
        candidates: GuardedCandidate[];
        allowedMints: string[];
        selected: GuardedCandidate | null;
        blockedCandidate: UnsafeCandidate | null;
        decision: 'proceed' | 'review';
        decisionReason: string;
        rawSearch: unknown;
        rawVariants: unknown;
    };
}

const SEARCH_PATH = '/api/v1/assets/search?q=tesla&limit=5';
const VARIANTS_PATH = '/api/v1/assets/tesla/variants?liquidityTier=tier1';
const XSTOCK_TESLA_LOGO_URL =
    'https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684aaf9559b2312c162731f5_Ticker%3DTSLA%2C%20Company%20Name%3DTesla%20Inc.%2C%20size%3D256x256.svg';

const NOISY_SEARCH_CANDIDATES: UnsafeCandidate[] = [
    {
        symbol: 'TSLAx',
        displaySymbol: 'TSLAx',
        name: 'Tesla xStock',
        shortMint: 'XsDo...HzoB',
        marketCapLabel: '$99.7M',
        volumeLabel: '$2.04M',
        liquidityLabel: '$2.44M',
        organicScoreLabel: '74',
    },
    {
        symbol: 'TSLAr',
        displaySymbol: 'TSLAr',
        name: 'Tesla rStock',
        shortMint: 'FJug...RhDe',
        marketCapLabel: '$498K',
        volumeLabel: '$0.00',
        liquidityLabel: '$31.3K',
        organicScoreLabel: '0',
    },
    {
        symbol: 'TSL2L',
        displaySymbol: 'TSL2L',
        name: 'Shift Tesla 2x Long',
        shortMint: '6afj...SHFT',
        marketCapLabel: '$20.9K',
        volumeLabel: '$3.55K',
        liquidityLabel: '-',
        organicScoreLabel: '53',
    },
    {
        symbol: 'TSL1S',
        displaySymbol: 'TSL1S',
        name: 'Shift Tesla 1x Short',
        shortMint: 'bNPX...SHFT',
        marketCapLabel: '$20.6K',
        volumeLabel: '$495',
        liquidityLabel: '-',
        organicScoreLabel: '0',
    },
    {
        symbol: 'TSLAon',
        displaySymbol: 'TSLAon',
        name: 'Tesla (Ondo Tokenized)',
        shortMint: 'KeGv...ondo',
        marketCapLabel: '$132K',
        volumeLabel: '$256',
        liquidityLabel: '-',
        organicScoreLabel: '0',
    },
];

const FALLBACK_SEARCH_RESPONSE = {
    results: [
        {
            assetId: 'tesla',
            name: 'Tesla',
            symbol: 'TSLA',
        },
    ],
};

const FALLBACK_VARIANTS_RESPONSE = {
    assetId: 'tesla',
    variants: [
        {
            variantId: 'tesla:xStock',
            mint: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB',
            kind: 'tokenized_equity',
            symbol: 'TSLAx',
            name: 'Tesla xStock',
            label: 'xStock',
            liquidityTier: 'tier1',
            trustTier: 'tier1',
            market: {
                liquidity: 2440000,
                volume24hUSD: 2040000,
                marketCap: 99700000,
                logoURI: XSTOCK_TESLA_LOGO_URL,
            },
        },
        {
            variantId: 'tesla:ondo',
            mint: 'KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo',
            kind: 'tokenized_equity',
            symbol: 'TSLAon',
            name: 'Tesla (Ondo Tokenized)',
            label: 'Ondo',
            liquidityTier: 'tier1',
            trustTier: 'tier1',
            market: {
                liquidity: 132000,
                volume24hUSD: 256,
                marketCap: 132000,
                logoURI: 'https://cdn.ondo.finance/tokens/logos/tslaon_160x160.png',
            },
        },
    ],
};

export function buildAgentTeslaDemoData({
    rawSearch,
    rawVariants,
    useFallbackVariants = false,
}: {
    rawSearch?: unknown;
    rawVariants?: unknown;
    useFallbackVariants?: boolean;
} = {}): AgentTeslaDemoViewModel {
    const effectiveSearch = rawSearch ?? FALLBACK_SEARCH_RESPONSE;
    const rawVariantsRecord = asRecord(rawVariants);
    const effectiveVariants =
        useFallbackVariants || !rawVariantsRecord || arrayAt(rawVariants, 'variants').length === 0
            ? FALLBACK_VARIANTS_RESPONSE
            : rawVariants;
    const assetId = textAt(effectiveVariants, 'assetId') || 'tesla';
    const guardedCandidates = guardedCandidatesFromData(effectiveVariants);
    const selected = guardedCandidates[0] ?? null;
    const allowedMints = guardedCandidates.map(candidate => candidate.mint);
    const allowedSymbols = new Set(guardedCandidates.map(candidate => normalize(candidate.symbol)).filter(Boolean));
    const allowedShortMints = new Set(guardedCandidates.map(candidate => normalize(candidate.shortMint)).filter(Boolean));
    const selectedKey = selected ? normalize(selected.symbol) : '';
    const selectedShortMint = selected ? normalize(selected.shortMint) : '';
    const fallbackBadPick = NOISY_SEARCH_CANDIDATES.find(candidate => candidate.symbol === 'TSLAr') ?? null;
    const blockedCandidate =
        guardedCandidates.length === 0
            ? fallbackBadPick
            : NOISY_SEARCH_CANDIDATES.find(candidate => {
                  const symbol = normalize(candidate.symbol);
                  const shortMint = normalize(candidate.shortMint);
                  return (
                      symbol !== selectedKey &&
                      shortMint !== selectedShortMint &&
                      !allowedSymbols.has(symbol) &&
                      !allowedShortMints.has(shortMint)
                  );
              }) ?? fallbackBadPick;

    return {
        task: {
            prompt: 'Buy $1,000 of Tesla exposure on Solana',
            notionalLabel: '$1,000',
        },
        unsafe: {
            searchSurface: 'Jupiter-like search',
            candidates: NOISY_SEARCH_CANDIDATES,
            selected: blockedCandidate,
            decisionReason: 'Matched on name and ticker, but did not verify against a canonical asset response.',
            riskSummary: blockedCandidate
                ? `${blockedCandidate.displaySymbol} is not returned by Tokens API for canonical tesla under liquidityTier=tier1.`
                : 'No unsafe candidate was selected.',
        },
        guarded: {
            searchPath: SEARCH_PATH,
            variantsPath: VARIANTS_PATH,
            assetId,
            candidates: guardedCandidates,
            allowedMints,
            selected,
            blockedCandidate,
            decision: selected ? 'proceed' : 'review',
            decisionReason: selected
                ? `Returned by Tokens API canonical Tesla variants under liquidityTier=tier1.`
                : 'No verified tier1 Tesla variant returned.',
            rawSearch: effectiveSearch,
            rawVariants: effectiveVariants,
        },
    };
}

export function agentTeslaViewModelFromData(data: unknown): AgentTeslaDemoViewModel {
    const record = asRecord(data);
    if (asRecord(record?.task) && asRecord(record?.unsafe) && asRecord(record?.guarded)) {
        return data as AgentTeslaDemoViewModel;
    }

    return buildAgentTeslaDemoData();
}

function guardedCandidatesFromData(data: unknown): GuardedCandidate[] {
    const variants = arrayAt(data, 'variants')
        .map(toGuardedCandidate)
        .filter(candidate => candidate !== null)
        .sort((a, b) => {
            const liquidityDelta = b.sortLiquidity - a.sortLiquidity;
            if (liquidityDelta !== 0) return liquidityDelta;

            const volumeDelta = b.sortVolume - a.sortVolume;
            if (volumeDelta !== 0) return volumeDelta;

            return a.candidate.symbol.localeCompare(b.candidate.symbol);
        });

    return variants.map(({ candidate }) => candidate);
}

function toGuardedCandidate(value: unknown): { candidate: GuardedCandidate; sortLiquidity: number; sortVolume: number } | null {
    const variant = asRecord(value);
    if (!variant) return null;

    const liquidityTier = parseTier(variant.liquidityTier);
    if (liquidityTier !== 'tier1') return null;

    const trustTier = parseTier(variant.trustTier) ?? liquidityTier;
    const market = recordAt(variant, 'market');
    const mint = textAt(variant, 'mint');
    const symbol = textAt(variant, 'symbol') || textAt(market, 'symbol') || 'TSLA';
    const name = textAt(variant, 'name') || textAt(market, 'name') || 'Tesla variant';
    const liquidity = numberAt(market, 'liquidity');
    const volume = numberAt(market, 'volume24hUSD');
    const rawLogoUrl = textAt(market, 'logoURI');

    if (!mint) return null;

    return {
        candidate: {
            symbol,
            name,
            mint,
            shortMint: shortenMint(mint),
            label: textAt(variant, 'label') || undefined,
            liquidityTier,
            trustTier,
            liquidityLabel: formatUsdCompact(liquidity),
            volumeLabel: formatUsdCompact(volume),
            marketCapLabel: formatUsdCompact(numberAt(market, 'marketCap')),
            logoUrl: resolveVariantLogoUrl({ mint, symbol, name, label: textAt(variant, 'label'), rawLogoUrl }),
        },
        sortLiquidity: liquidity ?? 0,
        sortVolume: volume ?? 0,
    };
}

function resolveVariantLogoUrl({
    mint,
    symbol,
    name,
    label,
    rawLogoUrl,
}: {
    mint: string;
    symbol: string;
    name: string;
    label: string;
    rawLogoUrl: string;
}): string {
    const xStockLogoUrl = getXStockTokenLogoUrl({ symbol, name, label, mint });
    if (xStockLogoUrl) return xStockLogoUrl;

    const ondoLogoUrl = getOndoTokenLogoUrl({ symbol, name, label, mint });
    if (ondoLogoUrl) return ondoLogoUrl;

    return getTokenLogoURLForMintWithSecondarySymbol(mint, symbol, name, rawLogoUrl) ?? rawLogoUrl;
}

function getXStockTokenLogoUrl({
    symbol,
    name,
    label,
    mint,
}: {
    symbol: string;
    name: string;
    label: string;
    mint: string;
}): string {
    const isXStock =
        mint.startsWith('Xs') ||
        symbol.toLowerCase().endsWith('x') ||
        name.toLowerCase().includes('xstock') ||
        label.toLowerCase() === 'xstock';

    if (!isXStock) return '';
    if (symbol.toLowerCase() === 'tslax') return XSTOCK_TESLA_LOGO_URL;

    return '';
}

function getOndoTokenLogoUrl({
    symbol,
    name,
    label,
    mint,
}: {
    symbol: string;
    name: string;
    label: string;
    mint: string;
}): string {
    const isOndo =
        mint.toLowerCase().endsWith('ondo') ||
        symbol.toLowerCase().endsWith('on') ||
        name.toLowerCase().includes('ondo') ||
        label.toLowerCase() === 'ondo';

    if (!isOndo) return '';

    return `https://cdn.ondo.finance/tokens/logos/${symbol.toLowerCase()}_160x160.png`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function recordAt(value: unknown, key: string): Record<string, unknown> | null {
    const record = asRecord(value);
    return asRecord(record?.[key]);
}

function arrayAt(value: unknown, key: string): unknown[] {
    const record = asRecord(value);
    const array = record?.[key];
    return Array.isArray(array) ? array : [];
}

function textAt(value: unknown, key: string): string {
    const record = asRecord(value);
    const text = record?.[key];
    return typeof text === 'string' ? text : '';
}

function numberAt(value: unknown, key: string): number | null {
    const record = asRecord(value);
    const number = record?.[key];
    return typeof number === 'number' && Number.isFinite(number) ? number : null;
}

function parseTier(value: unknown): Tier | null {
    return value === 'tier1' || value === 'tier2' || value === 'tier3' ? value : null;
}

function normalize(value: string): string {
    return value.replaceAll('...', '').replaceAll('…', '').trim().toLowerCase();
}

function shortenMint(mint: string): string {
    if (mint.length <= 8) return mint;
    return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

function formatUsdCompact(value: number | null): string {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: value >= 1000000 ? 2 : 1,
    }).format(value);
}
