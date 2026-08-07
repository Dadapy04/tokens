export const HERMES_PUBLIC_ENDPOINT = 'https://hermes.pyth.network';

export interface HermesPriceFeedMetadata {
    id: string;
    attributes: Record<string, string>;
}

export function normalizeHermesSymbol(value: string): string {
    return value.trim().toUpperCase();
}

function upperAttr(feed: HermesPriceFeedMetadata, key: string): string {
    const normalizedKey = key.trim().toLowerCase();
    return (feed.attributes?.[normalizedKey] ?? '').trim().toUpperCase();
}

export function pickExactCryptoUsdFeedId(symbolUpper: string, feeds: HermesPriceFeedMetadata[]): string | null {
    const wantedDisplay = `${symbolUpper}/USD`;
    const wantedSymbol = `CRYPTO.${symbolUpper}/USD`;

    const candidates = feeds.flatMap(feed => {
        const id = (feed?.id ?? '').trim();
        return id ? [{ id, feed }] : [];
    });

    const exactBaseUsd = candidates.filter(
        ({ feed }) => upperAttr(feed, 'quote_currency') === 'USD' && upperAttr(feed, 'base') === symbolUpper,
    );

    const exactDisplay = exactBaseUsd.find(({ feed }) => upperAttr(feed, 'display_symbol') === wantedDisplay);
    if (exactDisplay) return exactDisplay.id;

    const exactSymbol = exactBaseUsd.find(({ feed }) => upperAttr(feed, 'symbol') === wantedSymbol);
    if (exactSymbol) return exactSymbol.id;

    if (exactBaseUsd.length === 1) return exactBaseUsd[0]!.id;

    return null;
}
