'use client';

import { memo, useState } from 'react';
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react';
import { cn } from '@tokens/ui/cn';

interface AnimatedPriceProps {
    value: string;
    className?: string;
    /** Disable animation (e.g. during chart scrubbing) */
    enabled?: boolean;
}

export const AnimatedPrice = memo(function AnimatedPrice({ value, className, enabled = true }: AnimatedPriceProps) {
    const shouldReduceMotion = useReducedMotion();
    // Determine slide direction from overall price movement. Uses the
    // setState-during-render pattern (instead of a ref write) so render stays
    // pure — React re-renders immediately with the updated direction.
    const [movement, setMovement] = useState({ value, up: true });
    if (movement.value !== value) {
        const prevNum = parseFloat(movement.value.replace(/[^0-9.]/g, ''));
        const currNum = parseFloat(value.replace(/[^0-9.]/g, ''));
        setMovement({ value, up: isNaN(prevNum) || currNum >= prevNum });
    }

    const animate = enabled && !shouldReduceMotion;

    if (!animate) {
        return <span className={cn('tabular-nums', className)}>{value}</span>;
    }

    const up = movement.up;

    const chars = value.split('');

    return (
        <LazyMotion features={domAnimation}>
            <span className={cn('inline-flex tabular-nums', className)} aria-label={value}>
                {chars.map((char, i) => {
                    if (!/\d/.test(char)) {
                        return (
                            <span key={`${i}-${char}`} className="inline-block">
                                {char}
                            </span>
                        );
                    }

                    return (
                        <span key={`d-${i}`} className="relative inline-block overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {/* Motion scopes will-change to the active transition; no permanent hint. */}
                                <m.span
                                    key={char}
                                    initial={{ y: up ? '100%' : '-100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: up ? '-100%' : '100%' }}
                                    transition={{
                                        duration: 0.15,
                                        ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quad
                                    }}
                                    className="inline-block"
                                >
                                    {char}
                                </m.span>
                            </AnimatePresence>
                        </span>
                    );
                })}
            </span>
        </LazyMotion>
    );
});
