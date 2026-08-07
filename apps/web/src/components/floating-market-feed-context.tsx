'use client';

import * as React from 'react';

// Lightweight context module split out of `floating-market-feed.tsx` so that
// always-rendered consumers (root layout provider, per-page context setters)
// don't pull the heavy feed bundle (motion, symbols-react, dropdowns, charts)
// into the base client bundle. The feed itself loads lazily via
// `floating-market-feed-lazy.tsx`.

export interface FloatingMarketFeedPageContextValue {
    displayName: string;
    tokenSymbol?: string;
    tokenLogoURI?: string;
    tokenFeedCoinId?: string;
    tokenFeedTerms?: string[];
    hasMobileBottomBar?: boolean;
    suppressFeed?: boolean;
}

interface FloatingMarketFeedContextValue {
    pageContext: FloatingMarketFeedPageContextValue | null;
    setPageContext: React.Dispatch<React.SetStateAction<FloatingMarketFeedPageContextValue | null>>;
}

const FloatingMarketFeedContext = React.createContext<FloatingMarketFeedContextValue | null>(null);

export function FloatingMarketFeedProvider({ children }: { children: React.ReactNode }) {
    const [pageContext, setPageContext] = React.useState<FloatingMarketFeedPageContextValue | null>(null);
    const value = React.useMemo(() => ({ pageContext, setPageContext }), [pageContext]);

    return (
        <FloatingMarketFeedContext.Provider value={value}>
            {children}
        </FloatingMarketFeedContext.Provider>
    );
}

export function useFloatingMarketFeedContext(): FloatingMarketFeedContextValue {
    const value = React.useContext(FloatingMarketFeedContext);
    if (!value) {
        throw new Error('FloatingMarketFeed must be rendered inside FloatingMarketFeedProvider');
    }
    return value;
}

export function FloatingMarketFeedPageContext(props: FloatingMarketFeedPageContextValue) {
    const { setPageContext } = useFloatingMarketFeedContext();
    const {
        displayName,
        hasMobileBottomBar,
        suppressFeed,
        tokenFeedCoinId,
        tokenFeedTerms,
        tokenLogoURI,
        tokenSymbol,
    } = props;

    React.useEffect(() => {
        setPageContext({
            displayName,
            hasMobileBottomBar,
            suppressFeed,
            tokenFeedCoinId,
            tokenLogoURI,
            tokenFeedTerms,
            tokenSymbol,
        });
        return () => setPageContext(null);
    }, [
        displayName,
        hasMobileBottomBar,
        setPageContext,
        suppressFeed,
        tokenFeedCoinId,
        tokenFeedTerms,
        tokenLogoURI,
        tokenSymbol,
    ]);

    return null;
}
