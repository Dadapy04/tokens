import * as React from 'react';

import { cn } from '@/lib/utils';

export function RocketIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('', className)}
            {...props}
        >
            <path
                d="M38.5 6c-5.2 1.7-10.2 6.7-14.7 11.2l-2.6 2.6c-3.2 3.2-5 7.6-5 12.1v3.2L8 45.2v10.8h10.8l8.1-8.2h3.2c4.5 0 8.9-1.8 12.1-5l2.6-2.6C49.3 35.7 54.3 30.7 56 25.5c1.6-5.2 1.3-12.8-3.1-17.2C48.5 4.7 40.9 4.4 38.5 6Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path d="M24.5 39.5 14 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M38 18a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="currentColor" opacity="0.35" />
            <path
                d="M28 36c-2.5 2.5-6 4-9.6 4H16v-2.4c0-3.6 1.5-7.1 4-9.6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}
