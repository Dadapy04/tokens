'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { trackEvent } from '@/lib/posthog-client';
import { IconCommand, IconK, IconMagnifyingglass } from 'symbols-react';

const TokenSearchDialog = dynamic(() => import('./token-search-dialog').then(m => m.TokenSearchDialog), {
    ssr: false,
});

/** Custom event other components can dispatch to open the search palette with attribution. */
export const OPEN_SEARCH_EVENT = 'tokens:open-search';

type SearchTrigger = 'keyboard' | 'click' | 'hero';

export function TokenSearch() {
    const [open, setOpen] = React.useState(false);

    const preloadDialog = React.useCallback(() => {
        if (typeof window === 'undefined') return;
        void import('./token-search-dialog');
    }, []);

    const handleOpenSearch = React.useCallback(
        (trigger: SearchTrigger) => {
            preloadDialog();
            setOpen(true);
            trackEvent('search_opened', { trigger });
        },
        [preloadDialog],
    );

    // Keyboard shortcut + custom open event (e.g. hero search button)
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleOpenSearch('keyboard');
            }
        };

        const openFromEvent = (e: Event) => {
            const trigger = (e as CustomEvent<{ trigger?: SearchTrigger }>).detail?.trigger;
            handleOpenSearch(trigger ?? 'click');
        };

        document.addEventListener('keydown', down);
        document.addEventListener(OPEN_SEARCH_EVENT, openFromEvent);
        return () => {
            document.removeEventListener('keydown', down);
            document.removeEventListener(OPEN_SEARCH_EVENT, openFromEvent);
        };
    }, [handleOpenSearch]);

    return (
        <>
            <button
                type="button"
                onClick={() => handleOpenSearch('click')}
                onMouseEnter={preloadDialog}
                onFocus={preloadDialog}
                className="group flex items-center gap-2 rounded-full border sm:border-border-medium sm:bg-white bg-transparent border-transparent px-3 py-2 text-sm text-text-low transition-[border-color,background-color,transform] hover:border-border-medium hover:text-text-medium cursor-pointer w-auto sm:w-[320px] justify-between active:scale-[0.98] motion-reduce:transition-none"
            >
                <div className="flex items-center gap-2">
                    <IconMagnifyingglass className="size-4 fill-text-low group-hover:fill-text-medium transition-colors" />
                    <span className="hidden sm:inline text-text-low group-hover:text-text-medium transition-colors">
                        Find tokens...
                    </span>
                </div>
                <div className="flex items-center gap-1 hidden sm:flex">
                    <kbd className="bg-gray-100 rounded-sm p-1.5">
                        <IconCommand className="size-2 fill-text-medium" />
                    </kbd>
                    <kbd className="bg-gray-100 rounded-sm p-1.5">
                        <IconK className="size-2 fill-text-medium" />
                    </kbd>
                </div>
            </button>

            {open && <TokenSearchDialog open={open} onOpenChange={setOpen} />}
        </>
    );
}
