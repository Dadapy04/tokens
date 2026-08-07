import * as React from 'react';

import { cn } from '@/lib/utils';

export function TetrisIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={cn('', className)} {...props}>
            <rect x="10" y="10" width="18" height="18" rx="3" fill="currentColor" opacity="0.25" />
            <rect x="28" y="10" width="18" height="18" rx="3" fill="currentColor" opacity="0.25" />
            <rect x="10" y="28" width="18" height="18" rx="3" fill="currentColor" opacity="0.25" />
            <rect x="28" y="28" width="18" height="18" rx="3" fill="currentColor" opacity="0.25" />
            <rect x="46" y="28" width="8" height="26" rx="3" fill="currentColor" opacity="0.2" />
            <rect x="10" y="46" width="36" height="8" rx="3" fill="currentColor" opacity="0.2" />
        </svg>
    );
}
