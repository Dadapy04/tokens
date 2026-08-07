'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface SearchVisibilityContextType {
    isHeroSearchVisible: boolean;
    setHeroSearchVisible: (visible: boolean) => void;
}

const SearchVisibilityContext = createContext<SearchVisibilityContextType | undefined>(undefined);

export function SearchVisibilityProvider({ children }: { children: ReactNode }) {
    // Default to false so header search shows on pages without a hero search
    const [isHeroSearchVisible, setIsHeroSearchVisible] = useState(false);

    const setHeroSearchVisible = useCallback((visible: boolean) => {
        setIsHeroSearchVisible(visible);
    }, []);

    const value = useMemo(
        () => ({ isHeroSearchVisible, setHeroSearchVisible }),
        [isHeroSearchVisible, setHeroSearchVisible],
    );

    return <SearchVisibilityContext.Provider value={value}>{children}</SearchVisibilityContext.Provider>;
}

export function useSearchVisibility() {
    const context = useContext(SearchVisibilityContext);
    if (context === undefined) {
        throw new Error('useSearchVisibility must be used within a SearchVisibilityProvider');
    }
    return context;
}
