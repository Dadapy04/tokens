import type { ReactNode } from 'react';

import { Skeleton } from '@tokens/ui/skeleton';
import { TokenRiskDisplay } from '@/app/token/[address]/components/token-risk-display';
import type { RiskTag } from '@/app/token/[address]/components/token-risk-display';
import type { MarketScoreInput } from '@/app/token/[address]/components/token-risk-helpers';

export interface RiskSectionShellProps {
    state:
        | { kind: 'loading' }
        | { kind: 'unavailable'; title: string; message: ReactNode }
        | { kind: 'ready'; tags: RiskTag[]; marketScoreInput: MarketScoreInput };
}

export function RiskSectionState({ state }: { state: RiskSectionShellProps['state'] }) {
    if (state.kind === 'loading') return <RiskSectionSkeleton />;
    if (state.kind === 'unavailable') {
        return (
            <div className="rounded-[32px] border border-border-light bg-gray-50/50 p-10 text-center">
                <p className="text-text-low text-[16px] text-pretty">{state.title}</p>
                <p className="text-text-extra-low text-[14px] mt-2 text-pretty">{state.message}</p>
            </div>
        );
    }

    return <TokenRiskDisplay tags={state.tags} marketScoreInput={state.marketScoreInput} />;
}

export function RiskSectionSkeleton() {
    return (
        <div className="">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="">
                    <div className="space-y-4">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <Skeleton className="h-5 w-40 bg-gray-100" />
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-5 w-16 bg-gray-100" />
                                    <Skeleton className="h-7 w-7 rounded-lg bg-gray-100" />
                                </div>
                            </div>
                        ))}
                        <Skeleton className="h-9 w-32 rounded-full bg-gray-100 mt-8" />
                    </div>
                </div>

                <div className="flex items-center justify-center">
                    <Skeleton className="h-48 w-full max-w-[320px] rounded-2xl bg-gray-100" />
                </div>
            </div>
        </div>
    );
}
