'use client';

import * as React from 'react';

import { cn } from '@tokens/ui/cn';
import { trackEvent } from '@/lib/posthog-client';

interface CopyButtonProps {
    /**
     * If provided, this string is copied to clipboard on click.
     * If you need async fetching before copying, use `onCopy`.
     */
    textToCopy?: string;
    /**
     * Optional custom copy handler (supports async).
     * If provided, it is responsible for writing to clipboard.
     */
    onCopy?: () => Promise<void> | void;
    displayText?: string | React.ReactNode;
    className?: string;
    iconClassName?: string;
    iconClassNameCheck?: string;
    showText?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    trackingEvent?: string;
    trackingProperties?: Record<string, unknown>;
}

function CopyIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
            <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path
                d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function CheckIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
            <path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function CopyButton({
    textToCopy,
    onCopy,
    displayText,
    className,
    iconClassName,
    iconClassNameCheck,
    showText = true,
    disabled,
    ariaLabel,
    trackingEvent,
    trackingProperties,
}: CopyButtonProps) {
    const [copied, setCopied] = React.useState(false);
    const [isPending, setIsPending] = React.useState(false);
    const resetTimeoutRef = React.useRef<number | null>(null);

    const computedAriaLabel = ariaLabel ?? (showText ? undefined : 'Copy to clipboard');

    React.useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
        };
    }, []);

    async function handleCopy() {
        if (disabled || isPending) return;

        try {
            setIsPending(true);
            if (onCopy) {
                await onCopy();
            } else {
                const value = textToCopy ?? '';
                await navigator.clipboard.writeText(value);
            }

            if (trackingEvent) {
                trackEvent(trackingEvent, trackingProperties);
            }

            setCopied(true);
            if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={disabled || isPending}
            aria-label={computedAriaLabel}
            className={cn(
                'group flex items-center justify-center gap-2 rounded-md bg-gray-100/60 p-1.5 px-2.5 hover:cursor-pointer hover:opacity-80',
                className,
                (disabled || isPending) && 'cursor-not-allowed opacity-50',
            )}
        >
            <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                {copied ? (
                    <CheckIcon className={cn('h-3.5 w-3.5 text-green-500 dark:text-green-300', iconClassNameCheck)} />
                ) : (
                    <CopyIcon
                        className={cn('h-3.5 w-3.5 text-text-extra-low group-hover:text-text-medium', iconClassName)}
                    />
                )}
            </div>
            {showText ? (
                <span className="font-sans text-sm font-medium text-text-high">
                    {displayText ?? textToCopy ?? 'Copy'}
                </span>
            ) : null}
        </button>
    );
}
