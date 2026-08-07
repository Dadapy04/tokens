import { describe, expect, it } from 'bun:test';

import {
    DEFAULT_FLOATING_MARKET_FEED_SETTINGS,
    getFloatingMarketFeedSource,
    getNextFloatingMarketFeedSize,
    isFloatingMarketFeedSize,
    resolveNextFloatingMarketFeedSettings,
    sanitizeFloatingMarketFeedSettings,
} from './floating-market-feed-utils';

describe('floating market feed settings', () => {
    it('sanitizes invalid persisted settings to defaults', () => {
        expect(JSON.stringify(sanitizeFloatingMarketFeedSettings(null))).toBe(
            JSON.stringify(DEFAULT_FLOATING_MARKET_FEED_SETTINGS),
        );
        expect(JSON.stringify(sanitizeFloatingMarketFeedSettings({ feedSize: 100, showNews: false, showTweets: false }))).toBe(
            JSON.stringify(DEFAULT_FLOATING_MARKET_FEED_SETTINGS),
        );
    });

    it('defaults to 25 pulled items', () => {
        expect(DEFAULT_FLOATING_MARKET_FEED_SETTINGS.feedSize).toBe(25);
    });

    it('defaults to the @tokens feed only', () => {
        expect(DEFAULT_FLOATING_MARKET_FEED_SETTINGS.showNews).toBe(false);
        expect(DEFAULT_FLOATING_MARKET_FEED_SETTINGS.showTweets).toBe(true);
        expect(getFloatingMarketFeedSource(DEFAULT_FLOATING_MARKET_FEED_SETTINGS)).toBe('tweets');
    });

    it('accepts only 15, 25, and 50 as feed sizes', () => {
        expect(isFloatingMarketFeedSize(15)).toBe(true);
        expect(isFloatingMarketFeedSize(25)).toBe(true);
        expect(isFloatingMarketFeedSize(50)).toBe(true);
        expect(isFloatingMarketFeedSize(10)).toBe(false);
        expect(isFloatingMarketFeedSize(20)).toBe(false);
    });

    it('cycles feed sizes in display order', () => {
        expect(getNextFloatingMarketFeedSize(15)).toBe(25);
        expect(getNextFloatingMarketFeedSize(25)).toBe(50);
        expect(getNextFloatingMarketFeedSize(50)).toBe(15);
    });

    it('turning off the last enabled source flips to the other source', () => {
        expect(
            JSON.stringify(
                resolveNextFloatingMarketFeedSettings(
                    {
                        feedSize: 25,
                        showNews: true,
                        showTweets: false,
                    },
                    { showNews: false },
                ),
            ),
        ).toBe(
            JSON.stringify({
                feedSize: 25,
                showNews: false,
                showTweets: true,
            }),
        );

        expect(
            JSON.stringify(
                resolveNextFloatingMarketFeedSettings(
                    {
                        feedSize: 25,
                        showNews: false,
                        showTweets: true,
                    },
                    { showTweets: false },
                ),
            ),
        ).toBe(
            JSON.stringify({
                feedSize: 25,
                showNews: true,
                showTweets: false,
            }),
        );
    });

    it('maps settings to API source values', () => {
        expect(getFloatingMarketFeedSource({ feedSize: 25, showNews: true, showTweets: true })).toBe('all');
        expect(getFloatingMarketFeedSource({ feedSize: 25, showNews: true, showTweets: false })).toBe('news');
        expect(getFloatingMarketFeedSource({ feedSize: 25, showNews: false, showTweets: true })).toBe('tweets');
    });
});
