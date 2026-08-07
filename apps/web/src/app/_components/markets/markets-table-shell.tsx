'use client';

import { Loader2 } from 'lucide-react';

import { MarketsPagination } from './markets-pagination';
import type { MarketsPaginationState } from './markets-types';

export interface MarketsTableShellProps {
    isLoading: boolean;
    children: React.ReactNode;
    pagination: MarketsPaginationState;
}

export function MarketsTableShell({ isLoading, children, pagination }: MarketsTableShellProps) {
    return (
        <div className="bg-white rounded-[32px] border border-border-medium shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 text-text-extra-low animate-spin" />
                    </div>
                )}
                {children}
            </div>
            <MarketsPagination state={pagination} />
        </div>
    );
}
