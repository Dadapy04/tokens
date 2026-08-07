import type { RefObject } from 'react';
import type { Mode } from './types';

export function SearchInput({
    mode,
    autoTyped,
    userQuery,
    inputRef,
    onInteract,
    onUserChange,
}: {
    mode: Mode;
    autoTyped: string;
    userQuery: string;
    inputRef: RefObject<HTMLInputElement | null>;
    onInteract: () => void;
    onUserChange: (value: string) => void;
}) {
    return (
        <div
            className="flex w-full cursor-text items-center gap-3 border-[1.5px] border-white/[0.09] p-4 transition-colors focus-within:border-white/[0.24]"
            onPointerDown={(e) => {
                if (e.target !== inputRef.current) {
                    e.preventDefault();
                    inputRef.current?.focus();
                }
            }}
        >
            <SearchIcon />
            <div className="relative h-[22px] flex-1 leading-[1.4]">
                {mode === 'auto' && (
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 flex items-center font-inter text-[length:var(--text-body-lg-size)] font-[var(--font-weight-medium)] text-text-extra-high"
                    >
                        {autoTyped.length === 0 ? '' : capitalize(autoTyped)}
                        <BlinkingCursor />
                    </span>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={mode === 'user' ? userQuery : ''}
                    onChange={(e) => {
                        onInteract();
                        onUserChange(e.target.value);
                    }}
                    onFocus={onInteract}
                    onKeyDown={onInteract}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    aria-label="Search assets"
                    className={`absolute inset-0 w-full bg-transparent font-inter text-[length:var(--text-body-lg-size)] font-[var(--font-weight-medium)] text-text-extra-high outline-none caret-white ${mode === 'auto' ? 'opacity-0' : 'opacity-100'}`}
                />
            </div>
        </div>
    );
}

function BlinkingCursor() {
    return (
        <span
            aria-hidden
            className="caret-blink ml-px hidden h-[18px] w-[1.5px] translate-y-[1px] bg-white md:inline-block"
        />
    );
}

function capitalize(s: string): string {
    return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

function SearchIcon() {
    return (
        <svg
            aria-hidden
            className="size-4 shrink-0 text-text-medium"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M14 14L11.1 11.1M12.67 7.33C12.67 10.28 10.28 12.67 7.33 12.67C4.39 12.67 2 10.28 2 7.33C2 4.39 4.39 2 7.33 2C10.28 2 12.67 4.39 12.67 7.33Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
