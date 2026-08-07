import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import {
    PRICE_DOWN,
    PRICE_UP,
    RESULT_CARD_SHADOW,
} from './constants';
import type { VariantCardResult } from './types';

export function ResultCard({ result }: { result: VariantCardResult }) {
    const change = result.stats.priceChange24hPercent ?? 0;
    const isUp = change >= 0;
    const color = isUp ? PRICE_UP : PRICE_DOWN;
    return (
        <div
            className="relative flex w-full flex-col bg-white/[0.04] p-6"
            style={{ boxShadow: RESULT_CARD_SHADOW }}
        >
            <div className="flex w-full items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <AssetLogo
                        imageUrl={
                            result.market?.logoURI ?? null
                        }
                        symbol={result.symbol}
                        name={result.name}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5 leading-[1.4]">
                        <span className="line-clamp-2 font-inter text-[length:var(--text-body-lg-size)] font-[var(--font-weight-medium)] text-text-extra-high">
                            {result.name}
                        </span>
                        <span className="font-inter text-[length:var(--text-body-lg-size)] text-text-low">
                            {result.symbol}
                        </span>
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 leading-[1.4]">
                    <span className="font-inter text-[length:var(--text-body-lg-size)] font-[var(--font-weight-medium)] text-text-extra-high tabular-nums">
                        {formatPrice(result.stats.price)}
                    </span>
                    <span
                        className="flex items-center gap-2 font-inter text-[length:var(--text-body-md-size)] tabular-nums"
                        style={{
                            color,
                            textShadow: `0 0 24px ${color}1F`,
                            fontFeatureSettings: "'lnum' 1, 'tnum' 1",
                        }}
                    >
                        <PriceTriangle direction={isUp ? 'up' : 'down'} color={color} />
                        {Math.abs(change).toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>
    );
}

export function EmptyResultCard() {
    return (
        <div className="relative flex w-full items-center justify-center p-6">
            <span className="font-inter text-[length:var(--text-body-md-size)] text-text-low">No results</span>
        </div>
    );
}

function AssetLogo({
    imageUrl,
    symbol,
    name,
}: {
    imageUrl?: string | null;
    symbol: string;
    name: string;
}) {
    if (imageUrl) {
        return (
            <Image
                src={imageUrl}
                alt={name}
                width={46}
                height={46}
                unoptimized
                className="size-[46px] shrink-0 rounded-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
            />
        );
    }
    return (
        <div
            aria-hidden
            className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-[#E31937] font-inter text-[20px] font-semibold text-white"
            style={{
                boxShadow:
                    'inset 0 1px 0 0 rgba(255,255,255,0.18), 0 1px 2px 0 rgba(0,0,0,0.32)',
            }}
        >
            {(symbol || name).charAt(0).toUpperCase()}
        </div>
    );
}

function PriceTriangle({
    direction,
    color,
}: {
    direction: 'up' | 'down';
    color: string;
}) {
    return (
        <svg
            aria-hidden
            className="size-2 shrink-0"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                transform:
                    direction === 'down' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
        >
            <path d="M4 1L7.46 7H0.54L4 1Z" fill={color} />
        </svg>
    );
}

export function ResultSkeleton() {
    return (
        <div className="skeleton-frame flex w-full flex-col gap-[10px]">
            {[0].map((i) => (
                <div
                    key={i}
                    className="relative flex w-full items-center gap-4 bg-white/[0.04] p-6"
                    style={{
                        boxShadow: RESULT_CARD_SHADOW,
                        animationDelay: `${i * 90}ms`,
                    }}
                >
                    <div
                        className="skeleton-bar size-[46px] shrink-0 rounded-full"
                        style={{ animationDelay: `${i * 90}ms` }}
                    />
                    <div className="flex flex-1 flex-col gap-2">
                        <div
                            className="skeleton-bar h-[12px] w-24"
                            style={{ animationDelay: `${i * 90 + 40}ms` }}
                        />
                        <div
                            className="skeleton-bar h-[12px] w-16"
                            style={{ animationDelay: `${i * 90 + 160}ms` }}
                        />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div
                            className="skeleton-bar h-[12px] w-20"
                            style={{ animationDelay: `${i * 90 + 80}ms` }}
                        />
                        <div
                            className="skeleton-bar h-[10px] w-12"
                            style={{ animationDelay: `${i * 90 + 220}ms` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
