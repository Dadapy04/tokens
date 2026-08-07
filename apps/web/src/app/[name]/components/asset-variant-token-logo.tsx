'use client';

import * as React from 'react';
import Image from 'next/image';

import type { LiquidityTier } from '@tokens/asset-registry';
import { normalizeLogoSrc } from '@/lib/normalize-logo-src';

function tierLabel(tier: LiquidityTier): '1' | '2' | '3' {
    switch (tier) {
        case 'tier1':
            return '1';
        case 'tier2':
            return '2';
        case 'tier3':
            return '3';
    }
}

function tierStyles(tier: LiquidityTier): { badgeClassName: string; textClassName: string } {
    switch (tier) {
        case 'tier1':
            return {
                badgeClassName: 'bg-[#D4AF37] border-white',
                textClassName: 'text-white',
            }; // gold
        case 'tier2':
            return {
                badgeClassName: 'bg-[#C0C0C0] border-white',
                textClassName: 'text-[#1C1C1D]',
            }; // silver
        case 'tier3':
            return {
                badgeClassName: 'bg-[#CD7F32] border-white',
                textClassName: 'text-white',
            }; // bronze
    }
}

export function AssetVariantTokenLogo({
    symbol,
    name,
    logoURI,
    tier,
}: {
    symbol: string;
    name: string;
    logoURI?: string;
    tier?: LiquidityTier;
}) {
    const [hasError, setHasError] = React.useState(false);

    const initials = (symbol || name || '??').slice(0, 2).toUpperCase();
    const resolvedLogoURI = normalizeLogoSrc((logoURI ?? '').trim() || undefined) ?? null;
    const badgeTier = tier ?? null;

    const TierBadge = badgeTier ? (
        <div className="absolute bottom-0 right-0 translate-x-1.5 translate-y-1.5">
            <div
                className={`flex size-5 items-center justify-center rounded-md border-2 ${tierStyles(badgeTier).badgeClassName}`}
                aria-hidden="true"
            >
                <span className={`text-[8px] font-bold ${tierStyles(badgeTier).textClassName}`}>
                    {tierLabel(badgeTier)}
                </span>
            </div>
        </div>
    ) : null;

    return (
        <div className="relative">
            {!resolvedLogoURI || hasError ? (
                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-border-light">
                    <span className="text-text-low font-medium text-xs">{initials}</span>
                </div>
            ) : (
                <Image
                    src={resolvedLogoURI}
                    alt={name}
                    width={40}
                    height={40}
                    className="size-10 rounded-full ring-2 ring-white bg-gray-50 object-cover"
                    unoptimized={/\.(svg|ico)(\?|#|$)/i.test(resolvedLogoURI)}
                    onError={() => setHasError(true)}
                />
            )}
            {TierBadge}
        </div>
    );
}
