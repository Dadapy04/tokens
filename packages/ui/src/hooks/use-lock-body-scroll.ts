import { useEffect, useLayoutEffect, useState } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useLockBodyScroll(initialLocked = false): [boolean, (locked: boolean) => void] {
    const [locked, setLocked] = useState(initialLocked);

    useEffect(() => {
        setLocked(initialLocked);
    }, [initialLocked]);

    useIsomorphicLayoutEffect(() => {
        if (!locked) return;

        // Calculate scrollbar width to prevent layout shift
        const scrollBarWidth = window.innerWidth - document.body.offsetWidth;
        document.documentElement.style.setProperty('--scrollbar-width', `${scrollBarWidth}px`);

        // Store original overflow value
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            // Restore original overflow
            document.body.style.overflow = originalOverflow;
            document.documentElement.style.removeProperty('--scrollbar-width');
        };
    }, [locked]);

    return [locked, setLocked];
}
