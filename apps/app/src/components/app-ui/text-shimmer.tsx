'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface TextShimmerProps extends React.HTMLAttributes<HTMLSpanElement> {
    duration?: number;
    children: React.ReactNode;
}

export function TextShimmer({ duration = 1.5, className, children, ...props }: TextShimmerProps) {
    return (
        <span className={cn('relative inline-block', className)} {...props}>
            <span className="relative z-10">{children}</span>
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 select-none bg-gradient-to-r from-transparent via-white/50 to-transparent bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_var(--shimmer-duration)_linear_infinite] motion-reduce:hidden"
                style={{ '--shimmer-duration': `${duration}s` } as React.CSSProperties}
            >
                {children}
            </span>
        </span>
    );
}
