import { domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { JsonTree } from '../json-tree';
import { FADE_MASK } from './constants';
import type { Phase } from './types';

const COLLAPSED_HEIGHT = 440;
const OVERFLOW_THRESHOLD = 8;
const EASE_OUT = [0.32, 0.72, 0, 1] as const;

export function RightPanel({
    data,
    phase,
    settleKey,
    stream,
    isMobile,
}: {
    data: unknown;
    phase: Phase;
    settleKey: string | number;
    stream: boolean;
    isMobile: boolean;
}) {
    const showSettled = phase === 'settled' || phase === 'deleting';
    const showSkeleton = !showSettled;
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();

    let heightTarget: number | string = '100%';
    if (isMobile) {
        heightTarget = !canExpand || expanded ? 'auto' : COLLAPSED_HEIGHT;
    }
    const heightTransition = reduce
        ? { duration: 0 }
        : { duration: expanded ? 0.42 : 0.32, ease: EASE_OUT };
    const fadeTransition = reduce
        ? { duration: 0 }
        : { duration: 0.32, ease: EASE_OUT };

    useEffect(() => {
        if (!isMobile) {
            setCanExpand(false);
            setExpanded(false);
            return;
        }

        const node = scrollRef.current;
        if (!node) return;

        const measure = () => {
            const nextCanExpand =
                node.scrollHeight > COLLAPSED_HEIGHT + OVERFLOW_THRESHOLD;
            setCanExpand(nextCanExpand);
            if (!nextCanExpand) setExpanded(false);
        };

        measure();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', measure);
            return () => window.removeEventListener('resize', measure);
        }

        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, [data, isMobile, phase, settleKey]);

    return (
        <div className="relative flex min-w-0 flex-1 flex-col bg-[#121213] p-3 md:h-full">
            <LazyMotion features={domAnimation}>
                <m.div
                    ref={scrollRef}
                    className={`json-scroll relative w-full min-h-0 p-4 md:overflow-y-auto md:overflow-x-hidden ${expanded ? '' : 'overflow-hidden'}`}
                    initial={false}
                    animate={{ height: heightTarget }}
                    transition={heightTransition}
                    style={
                        isMobile
                            ? undefined
                            : { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }
                    }
                >
                    {showSettled && (
                        <div
                            key={settleKey}
                            className="json-frame"
                            data-state={phase === 'settled' ? 'settled' : 'deleting'}
                        >
                            <JsonTree
                                value={data}
                                stream={stream && phase === 'settled'}
                                isMobile={isMobile}
                            />
                        </div>
                    )}
                    {showSkeleton && <JsonSkeleton />}
                    {isMobile && canExpand && (
                        <m.div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
                            style={{
                                background:
                                    'linear-gradient(to bottom, transparent 0%, #121213 100%)',
                            }}
                            initial={false}
                            animate={{ opacity: expanded ? 0 : 1 }}
                            transition={fadeTransition}
                        />
                    )}
                </m.div>
            </LazyMotion>
            {isMobile && canExpand && (
                <div
                    className="sticky bottom-0 flex justify-center pb-2 pt-6 md:hidden"
                    style={{
                        background:
                            'linear-gradient(to top, #121213 55%, rgba(18,18,19,0) 100%)',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        aria-expanded={expanded}
                        className="flex items-center gap-2 px-4 py-2 font-inter text-[13px] font-medium text-white/[0.56] transition-colors hover:text-white/[0.86] active:text-white/[0.72]"
                    >
                        <span>{expanded ? 'Collapse' : 'Expand'}</span>
                        <svg
                            aria-hidden
                            className={`size-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M3 4.5L6 7.5L9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            )}
            <CopyButton data={data} />
        </div>
    );
}

const SKELETON_LINES: { width: number; indent: number; delay: number }[] = [
    { width: 12, indent: 0, delay: 0 },
    { width: 140, indent: 1, delay: 40 },
    { width: 120, indent: 1, delay: 80 },
    { width: 90, indent: 1, delay: 120 },
    { width: 60, indent: 2, delay: 160 },
    { width: 180, indent: 3, delay: 200 },
    { width: 160, indent: 3, delay: 240 },
    { width: 120, indent: 3, delay: 280 },
    { width: 200, indent: 3, delay: 320 },
    { width: 60, indent: 2, delay: 360 },
    { width: 60, indent: 2, delay: 400 },
    { width: 170, indent: 3, delay: 440 },
    { width: 140, indent: 3, delay: 480 },
    { width: 110, indent: 3, delay: 520 },
    { width: 190, indent: 3, delay: 560 },
    { width: 60, indent: 2, delay: 600 },
    { width: 60, indent: 2, delay: 640 },
    { width: 160, indent: 3, delay: 680 },
    { width: 130, indent: 3, delay: 720 },
    { width: 100, indent: 3, delay: 760 },
    { width: 180, indent: 3, delay: 800 },
    { width: 60, indent: 2, delay: 840 },
    { width: 60, indent: 1, delay: 880 },
    { width: 12, indent: 0, delay: 920 },
];

function JsonSkeleton() {
    return (
        <div className="skeleton-frame font-berkeley-mono text-[12.5px] leading-[1.7]">
            {SKELETON_LINES.map((l, i) => (
                <div
                    key={i}
                    className="flex items-center"
                    style={{ paddingLeft: `${l.indent * 14}px`, height: '21px' }}
                >
                    <div
                        className="skeleton-bar h-[10px]"
                        style={{
                            width: `${l.width}px`,
                            animationDelay: `${l.delay}ms`,
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

function CopyButton({ data }: { data: unknown }) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopied(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 1400);
        } catch {
            // clipboard write may fail on insecure contexts; ignore silently
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy response'}
            className="absolute right-6 top-6 hidden size-8 items-center justify-center rounded-md bg-white/[0.08] text-text-medium transition-[background-color,transform] duration-150 hover:bg-white/[0.12] hover:text-text-extra-high active:scale-[0.96] md:flex"
        >
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
    );
}

function CopyIcon() {
    return (
        <svg
            className="size-3.5"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <rect
                x="5"
                y="5"
                width="8"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.4"
            />
            <path
                d="M2 9c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h6c.55 0 1 .45 1 1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            className="size-3.5 text-[#00FFA3]"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                d="M2.5 6.25L4.75 8.5L9.5 3.75"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
