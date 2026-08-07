export type FloatingMarketFeedSize = 15 | 25 | 50;
export type FloatingMarketFeedSource = 'all' | 'news' | 'tweets';

export interface FloatingMarketFeedSettings {
    feedSize: FloatingMarketFeedSize;
    showNews: boolean;
    showTweets: boolean;
}

export const FLOATING_MARKET_FEED_SIZE_OPTIONS = [15, 25, 50] as const satisfies readonly FloatingMarketFeedSize[];

export const DEFAULT_FLOATING_MARKET_FEED_SETTINGS: FloatingMarketFeedSettings = {
    feedSize: 25,
    showNews: false,
    showTweets: true,
};

function isSettingsRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function isFloatingMarketFeedSize(value: unknown): value is FloatingMarketFeedSize {
    return FLOATING_MARKET_FEED_SIZE_OPTIONS.includes(value as FloatingMarketFeedSize);
}

export function getNextFloatingMarketFeedSize(current: FloatingMarketFeedSize): FloatingMarketFeedSize {
    const currentIndex = FLOATING_MARKET_FEED_SIZE_OPTIONS.indexOf(current);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % FLOATING_MARKET_FEED_SIZE_OPTIONS.length;
    return FLOATING_MARKET_FEED_SIZE_OPTIONS[nextIndex] ?? DEFAULT_FLOATING_MARKET_FEED_SETTINGS.feedSize;
}

export function sanitizeFloatingMarketFeedSettings(value: unknown): FloatingMarketFeedSettings {
    if (!isSettingsRecord(value)) return DEFAULT_FLOATING_MARKET_FEED_SETTINGS;

    const feedSize = isFloatingMarketFeedSize(value.feedSize)
        ? value.feedSize
        : DEFAULT_FLOATING_MARKET_FEED_SETTINGS.feedSize;
    const showNews = typeof value.showNews === 'boolean' ? value.showNews : DEFAULT_FLOATING_MARKET_FEED_SETTINGS.showNews;
    const showTweets =
        typeof value.showTweets === 'boolean' ? value.showTweets : DEFAULT_FLOATING_MARKET_FEED_SETTINGS.showTweets;

    if (!showNews && !showTweets) return DEFAULT_FLOATING_MARKET_FEED_SETTINGS;

    return {
        feedSize,
        showNews,
        showTweets,
    };
}

export function resolveNextFloatingMarketFeedSettings(
    previous: FloatingMarketFeedSettings,
    patch: Partial<FloatingMarketFeedSettings>,
): FloatingMarketFeedSettings {
    const next = {
        ...previous,
        ...patch,
    };

    if (patch.showNews === false && !next.showNews && !next.showTweets) {
        return {
            ...next,
            showTweets: true,
        };
    }

    if (patch.showTweets === false && !next.showNews && !next.showTweets) {
        return {
            ...next,
            showNews: true,
        };
    }

    return sanitizeFloatingMarketFeedSettings(next);
}

export function getFloatingMarketFeedSource(settings: FloatingMarketFeedSettings): FloatingMarketFeedSource {
    if (settings.showNews && settings.showTweets) return 'all';
    if (settings.showNews) return 'news';
    if (settings.showTweets) return 'tweets';
    return 'all';
}

export function getFloatingMarketFeedTitle(_settings: FloatingMarketFeedSettings): string {
    return 'Latest Updates';
}

export function getFloatingMarketFeedEmptyNoun(settings: FloatingMarketFeedSettings): string {
    const source = getFloatingMarketFeedSource(settings);
    if (source === 'news') return 'news';
    if (source === 'tweets') return 'tweets';
    return 'updates';
}
