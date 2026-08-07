'use client';

import dynamic from 'next/dynamic';

// Load the market feed (motion + symbols-react) outside the base bundle,
// client-only — it's a floating overlay with no SEO value.
const FloatingMarketFeed = dynamic(
    () => import('./floating-market-feed').then(m => m.FloatingMarketFeed),
    { ssr: false },
);

const MobileMarketBanner = dynamic(
    () => import('./floating-market-feed').then(m => m.MobileMarketBanner),
    { ssr: false },
);

export function FloatingMarketFeedLazy() {
    return <FloatingMarketFeed />;
}

export function MobileMarketBannerLazy() {
    return <MobileMarketBanner />;
}
