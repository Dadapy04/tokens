import type { RefObject } from 'react';
import { FADE_MASK } from './constants';
import { EmptyResultCard, ResultCard, ResultSkeleton } from './result-card';
import { SearchInput } from './search-input';
import type { Mode, Phase, VariantCardResult } from './types';

export function LeftPanel({
    results,
    phase,
    settleKey,
    mode,
    autoTyped,
    userQuery,
    inputRef,
    onInteract,
    onUserChange,
}: {
    results: VariantCardResult[];
    phase: Phase;
    settleKey: string | number;
    mode: Mode;
    autoTyped: string;
    userQuery: string;
    inputRef: RefObject<HTMLInputElement | null>;
    onInteract: () => void;
    onUserChange: (value: string) => void;
}) {
    const showSettled = phase === 'settled' || phase === 'deleting';
    const isSettled = phase === 'settled';
    const dataState: 'settled' | 'deleting' = isSettled ? 'settled' : 'deleting';

    return (
        <div className="flex w-full shrink-0 flex-col items-stretch gap-[10px] border-b border-[#2c2c2d] bg-white/[0.02] p-6 md:h-full md:w-[396px] md:border-b-0 md:border-r">
            <SearchInput
                mode={mode}
                autoTyped={autoTyped}
                userQuery={userQuery}
                inputRef={inputRef}
                onInteract={onInteract}
                onUserChange={onUserChange}
            />
            <div
                className="json-scroll relative hidden w-full flex-1 flex-col min-h-0 md:flex md:overflow-y-auto md:overflow-x-hidden"
                style={{
                    maskImage: FADE_MASK,
                    WebkitMaskImage: FADE_MASK,
                }}
            >
                {showSettled && results.length > 0 && (
                    <div
                        key={settleKey}
                        className="flex w-full flex-col gap-[10px]"
                    >
                        {results.map((result, index) => (
                            <div
                                key={result.mint}
                                className={`result-frame ${isSettled ? 'card-enter' : ''}`}
                                data-state={dataState}
                                style={
                                    isSettled
                                        ? { animationDelay: `${index * 30}ms` }
                                        : undefined
                                }
                            >
                                <ResultCard result={result} />
                            </div>
                        ))}
                    </div>
                )}
                {showSettled && results.length === 0 && (
                    <div
                        key={`empty-${settleKey}`}
                        className="result-frame flex flex-1 items-center justify-center"
                        data-state={dataState}
                    >
                        <EmptyResultCard />
                    </div>
                )}
                {!showSettled && <ResultSkeleton />}
            </div>
        </div>
    );
}
