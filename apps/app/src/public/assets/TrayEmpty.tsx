import * as React from 'react';

import { cn } from '@/lib/utils';

export function TrayEmpty({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('', className)}
            {...props}
        >
            <path
                d="M10 22h44l6 22a10 10 0 0 1-9.6 13H13.6A10 10 0 0 1 4 44l6-22Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path d="M22 40h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M18 22a14 14 0 0 1 28 0" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        </svg>
    );
}
