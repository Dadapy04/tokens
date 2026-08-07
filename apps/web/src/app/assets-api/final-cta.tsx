'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { trackEvent } from '@/lib/posthog-client';
import { SpinningLogo } from './spinning-logo';

const SECONDARY_BUTTON_SHADOW =
    'inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.12), 0 1px 1px -0.5px rgba(0,0,0,0.18), 0 3px 3px -1.5px rgba(0,0,0,0.18)';

const TokenAsteroidsGame = dynamic(
    () => import('./token-asteroids-modal').then(mod => mod.TokenAsteroidsGame),
    {
        ssr: false,
        loading: () => <TokenAsteroidsGamePlaceholder />,
    },
);

export function FinalCta() {
    const [asteroidsOpen, setAsteroidsOpen] = useState(false);

    return (
        <section className="relative bg-[#0F0F10]">
            <div
                aria-hidden
                className="ruler-line h-px w-full bg-[#2c2c2d]"
                style={{ animationDelay: '800ms' }}
            />
            <div className="mx-auto max-w-[1120px] px-6">
                <div
                    className={`relative flex w-full flex-col items-center justify-center overflow-hidden border-x border-[#2c2c2d] ${
                        asteroidsOpen ? 'p-0' : 'gap-11 px-6 py-24 md:py-[124px]'
                    }`}
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 42.667%)',
                    }}
                >
                    {asteroidsOpen ? (
                        <div className="w-full min-h-[260px] md:min-h-[540px]">
                            <TokenAsteroidsGame open={asteroidsOpen} onOpenChange={setAsteroidsOpen} />
                        </div>
                    ) : (
                        <>
                            <SpinningLogo onClick={() => setAsteroidsOpen(true)} />
                            <h2 className="font-diatype-medium text-[length:var(--text-display)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-text-extra-high text-balance text-center">
                                Time to get shipping.
                            </h2>
                            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
                                <Link
                                    href="https://app.tokens.xyz"
                                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-5 text-[length:var(--text-button-xl)] leading-none font-inter-semibold text-black transition-[colors,transform] duration-150 hover:bg-white/90 active:scale-[0.96] sm:w-auto"
                                    onClick={() =>
                                        trackEvent('api_cta_clicked', {
                                            cta: 'get_api_keys',
                                            link_url: 'https://app.tokens.xyz',
                                            source: 'assets_api_final_cta',
                                        })
                                    }
                                >
                                    Get your API keys
                                </Link>
                                <Link
                                    href="https://docs.tokens.xyz"
                                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white/[0.12] px-5 text-[length:var(--text-button-xl)] leading-none font-inter-semibold text-text-high transition-[colors,transform] duration-150 hover:bg-white/[0.18] active:scale-[0.96] sm:w-auto"
                                    style={{ boxShadow: SECONDARY_BUTTON_SHADOW }}
                                    onClick={() =>
                                        trackEvent('api_cta_clicked', {
                                            cta: 'documentation',
                                            link_url: 'https://docs.tokens.xyz',
                                            source: 'assets_api_final_cta',
                                        })
                                    }
                                >
                                    Documentation
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div
                aria-hidden
                className="ruler-line h-px w-full bg-[#2c2c2d]"
                style={{ animationDelay: '860ms' }}
            />
            <div className="mx-auto max-w-[1120px] px-6 pb-10">
                <SiteFooter
                    tone="dark"
                    asteroidsOpen={asteroidsOpen}
                    onAsteroidsOpenChange={setAsteroidsOpen}
                />
            </div>
        </section>
    );
}

function TokenAsteroidsGamePlaceholder() {
    return (
        <div className="mx-auto w-full max-w-none overflow-hidden rounded-none border border-[#2c2c2d] bg-[#08080A] p-0">
            <div className="relative aspect-[16/9] max-h-[62dvh] min-h-[260px] w-full overflow-hidden bg-[#0F0F10]">
                <div className="absolute inset-x-3 top-3 flex items-start justify-between sm:inset-x-4 sm:top-4">
                    <div className="h-4 w-20 bg-white/20" />
                    <div className="flex gap-2">
                        <div className="size-9 border border-[#2c2c2d]" />
                        <div className="size-9 border border-[#2c2c2d]" />
                    </div>
                </div>
                <div className="absolute right-3 bottom-3 h-4 w-48 bg-white/20 sm:right-4 sm:bottom-4" />
                <div className="absolute bottom-3 left-3 flex gap-3 sm:bottom-4 sm:left-4">
                    <div className="h-3 w-28 bg-white/15" />
                    <div className="h-3 w-20 bg-white/15" />
                </div>
            </div>
        </div>
    );
}
