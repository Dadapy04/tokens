import * as React from 'react';

import { cn } from '@/lib/utils';

export function PassedIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={cn('', className)} {...props}>
            <path
                d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z"
                fill="currentColor"
                opacity="0.2"
            />
            <path
                d="M10.3 14.6 7.9 12.2a1 1 0 1 0-1.4 1.4l3.1 3.1a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 0 0-1.4-1.4l-5.8 5.8Z"
                fill="currentColor"
            />
        </svg>
    );
}
