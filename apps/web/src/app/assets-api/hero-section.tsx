'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/posthog-client';
import { SpinningLogo } from './spinning-logo';

interface HeroSectionProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
}

const SECONDARY_BUTTON_SHADOW =
    'inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.12), 0 1px 1px -0.5px rgba(0,0,0,0.18), 0 3px 3px -1.5px rgba(0,0,0,0.18)';

const DEFAULT_TITLE = 'Discover high-quality assets on Solana.';
const TITLE_WORD_BASE_DELAY_MS = 120;
const TITLE_WORD_STAGGER_MS = 55;

function AnimatedTitleWords({ text }: { text: string }) {
    const words = text.split(' ');
    return (
        <>
            {words.map((word, i) => (
                <Fragment key={`${i}-${word}`}>
                    <span
                        className="hero-word-enter inline-block"
                        style={{
                            animationDelay: `${TITLE_WORD_BASE_DELAY_MS + i * TITLE_WORD_STAGGER_MS}ms`,
                        }}
                        onAnimationEnd={(e) => {
                            // Drop the will-change hint once the one-shot
                            // entrance finishes so the span is de-promoted.
                            e.currentTarget.style.willChange = 'auto';
                        }}
                    >
                        {word}
                    </span>
                    {i < words.length - 1 ? ' ' : ''}
                </Fragment>
            ))}
        </>
    );
}

export function HeroSection({
    title,
    subtitle = 'Search any asset once. Get every Solana variant, unified market data, and a faster path to build.',
}: HeroSectionProps) {
    const titleWordsCount = DEFAULT_TITLE.split(' ').length;
    const titleEndMs = TITLE_WORD_BASE_DELAY_MS + (titleWordsCount - 1) * TITLE_WORD_STAGGER_MS;
    const subtitleDelayMs = titleEndMs - 40;
    const ctaDelayMs = subtitleDelayMs + 110;

    return (
        <>
            <style>{`
                @keyframes hero-word-in {
                    from { opacity: 0; transform: translateY(6px); filter: blur(8px); }
                    to { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                @keyframes hero-in {
                    from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
                    to { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                .hero-word-enter {
                    animation: hero-word-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
                    will-change: transform;
                }
                .hero-enter {
                    animation: hero-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @media (prefers-reduced-motion: reduce) {
                    .hero-word-enter, .hero-enter { animation: none; }
                    .hero-word-enter { will-change: auto; }
                }
            `}</style>
            <div className="mx-auto flex flex-col items-center gap-11 text-center">
                <div
                    className="hero-enter"
                    style={{ animationDelay: '40ms' }}
                >
                    <SpinningLogo />
                </div>

                <div className="flex flex-col items-center gap-9 w-full max-w-[650px]">
                    <div className="flex flex-col items-center gap-6 w-full">
                        <h1 className="font-diatype-medium text-[40px] md:text-[56px] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-text-extra-high text-balance">
                            {title ?? <AnimatedTitleWords text={DEFAULT_TITLE} />}
                        </h1>
                        <p
                            className="hero-enter font-inter text-[length:var(--text-body-lg-size)] leading-[var(--leading-normal)] text-text-low max-w-full sm:max-w-[386px] text-pretty"
                            style={{ animationDelay: `${subtitleDelayMs}ms` }}
                        >
                            {subtitle}
                        </p>
                    </div>

                    <div
                        className="hero-enter flex items-center gap-2"
                        style={{ animationDelay: `${ctaDelayMs}ms` }}
                    >
                        <Link
                            href="https://app.tokens.xyz"
                            className="inline-flex h-9 items-center justify-center rounded-full bg-white px-3.5 text-[length:var(--text-button-md)] leading-none font-inter-semibold text-black transition-[colors,transform] duration-150 hover:bg-white/90 active:scale-[0.96]"
                            onClick={() =>
                                trackEvent('api_cta_clicked', {
                                    cta: 'get_api_keys',
                                    link_url: 'https://app.tokens.xyz',
                                    source: 'assets_api_hero',
                                })
                            }
                        >
                            Get your API keys
                        </Link>
                        <Link
                            href="https://docs.tokens.xyz"
                            className="inline-flex h-9 items-center justify-center rounded-full bg-white/[0.12] px-3.5 text-[length:var(--text-button-md)] leading-none font-inter-semibold text-text-high transition-[colors,transform] duration-150 hover:bg-white/[0.18] active:scale-[0.96]"
                            style={{ boxShadow: SECONDARY_BUTTON_SHADOW }}
                            onClick={() =>
                                trackEvent('api_cta_clicked', {
                                    cta: 'documentation',
                                    link_url: 'https://docs.tokens.xyz',
                                    source: 'assets_api_hero',
                                })
                            }
                        >
                            Documentation
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
