'use client';

import { useState, useMemo } from 'react';

import { cn } from '@tokens/ui/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@tokens/ui/tooltip';
import {
    clamp,
    computeMarketScore,
    formatInteger,
    formatLiquidityRatio,
    formatUsdCompact,
    formatVolumeToLiquidityRatio,
    type MarketScoreInput,
    type RiskStatus,
} from './token-risk-helpers';
import {
    IconCheckmark,
    IconCheckmarkShieldFill,
    IconExclamationmarkTriangleFill,
    IconInfoCircleFill,
    IconXmark,
} from 'symbols-react';
import { Button } from '@tokens/ui/button';
import { trackEvent } from '@/lib/posthog-client';

export interface RiskTag {
    key: string;
    name: string;
    type: string;
    severity: number;
    description: string;
}

interface TokenRiskDisplayProps {
    tags: RiskTag[];
    marketScoreInput: MarketScoreInput;
}

export function TokenRiskDisplay({ tags, marketScoreInput }: TokenRiskDisplayProps) {
    const [showDetails, setShowDetails] = useState(false);

    const marketScore = useMemo(() => computeMarketScore(marketScoreInput), [marketScoreInput]);

    // Handle insufficient data state
    if (marketScore.hasInsufficientData) {
        return (
            <InsufficientDataDisplay reason={marketScore.insufficientDataReason} tags={tags} input={marketScoreInput} />
        );
    }

    if (showDetails) {
        return (
            <TooltipProvider delayDuration={200}>
                <div className="">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-title-sm text-text-extra-high">Risk factors</h4>
                        <button
                            type="button"
                            onClick={() => setShowDetails(false)}
                            className="inline-flex items-center justify-center size-8 rounded-lg border border-border-light bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                            aria-label="Close details"
                        >
                            <IconXmark className="h-3.5 w-3.5 fill-text-medium" />
                        </button>
                    </div>

                    {tags.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tags.map(tag => (
                                <div
                                    key={tag.key}
                                    className={cn(
                                        'rounded-2xl border border-border-light bg-white p-5',
                                        tag.severity >= 10 && 'border-red-200 bg-red-50/40',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="text-body-md text-text-extra-high font-medium truncate">
                                            {tag.name}
                                        </div>
                                        <div className="shrink-0 text-[11px] font-sans text-text-low tabular-nums">
                                            SEV {tag.severity}
                                        </div>
                                    </div>
                                    <p className="text-body-md text-text-low text-pretty">{tag.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-body-md text-text-low text-pretty">
                            No risk factors detected from on-chain analysis.
                        </div>
                    )}

                    {/* Show caps and borderline signals if any */}
                    {(marketScore.caps.length > 0 || marketScore.borderlineSignals.length > 0) && (
                        <div className="mt-6 pt-6 border-t border-border-light">
                            <h5 className="text-body-md text-text-extra-high font-medium mb-3">
                                Market Score Adjustments
                            </h5>
                            <div className="space-y-2">
                                {marketScore.caps.map(cap => (
                                    <div key={cap} className="text-body-md text-text-low flex items-center gap-2">
                                        <IconExclamationmarkTriangleFill className="h-3 w-3 fill-amber-500 shrink-0" />
                                        <span>{cap}</span>
                                    </div>
                                ))}
                                {marketScore.borderlineSignals.map(signal => (
                                    <div key={signal} className="text-body-md text-text-extra-low flex items-center gap-2">
                                        <IconInfoCircleFill className="h-3 w-3 fill-text-extra-low shrink-0" />
                                        <span>{signal}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </TooltipProvider>
        );
    }

    // Build tooltip strings for each component
    const liquidityTooltip = buildLiquidityTooltip(marketScoreInput, marketScore.components.liquidityHealth.score);
    const holderDistTooltip = buildHolderDistributionTooltip(
        marketScoreInput,
        marketScore.components.holderDistribution.score,
    );
    const tradingTooltip = buildTradingActivityTooltip(marketScoreInput, marketScore.components.tradingActivity.score);
    const holderCountTooltip = buildHolderCountTooltip(marketScoreInput, marketScore.components.holderCount.score);

    return (
        <TooltipProvider delayDuration={200}>
            <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="p-0 py-6">
                        <div className="divide-y divide-border-light">
                            <ScoreRow
                                label="Liquidity"
                                value={formatUsdCompact(marketScoreInput.liquidityUsd)}
                                status={marketScore.components.liquidityHealth.status}
                                tooltip={liquidityTooltip}
                            />
                            <ScoreRow
                                label="Distribution"
                                value={
                                    marketScoreInput.top10HoldersPercent != null
                                        ? `${marketScoreInput.top10HoldersPercent.toFixed(1)}%`
                                        : '—'
                                }
                                status={marketScore.components.holderDistribution.status}
                                tooltip={holderDistTooltip}
                            />
                            <ScoreRow
                                label="Trading"
                                value={formatUsdCompact(marketScoreInput.volume7dUsd)}
                                status={marketScore.components.tradingActivity.status}
                                tooltip={tradingTooltip}
                            />
                            <ScoreRow
                                label="Holders"
                                value={
                                    marketScoreInput.holderCount != null
                                        ? formatInteger(marketScoreInput.holderCount)
                                        : '—'
                                }
                                status={marketScore.components.holderCount.status}
                                tooltip={holderCountTooltip}
                            />
                        </div>

                        {(tags.length > 0 || marketScore.caps.length > 0) && (
                            <Button
                                type="button"
                                onClick={() => {
                                    trackEvent('risk_details_expanded', {
                                        ...(marketScore.score != null ? { risk_score: marketScore.score } : {}),
                                    });
                                    setShowDetails(true);
                                }}
                                variant="secondary"
                                size="lg"
                                className="mt-8 w-full rounded-full"
                            >
                                See all details
                            </Button>
                        )}
                    </div>

                    <div className="rounded-[18px] bg-white border border-border-light p-6 pt-0 flex items-center justify-center">
                        <div className="w-full max-w-[320px] mt-[-20px]">
                            <MarketScoreGauge
                                score={marketScore.hasInsufficientData ? null : marketScore.score}
                                grade={marketScore.grade}
                                tone={marketScore.tone}
                                label={marketScore.label}
                                isTrustedLaunch={marketScore.isTrustedLaunch}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

// ---------------------------------------------------------------------------
// Tooltip Builders
// ---------------------------------------------------------------------------

function buildLiquidityTooltip(input: MarketScoreInput, componentScore: number): string {
    const parts: string[] = ['Measures ability to trade without significant price impact.'];

    if (input.liquidityUsd != null) {
        parts.push(`Liquidity: ${formatUsdCompact(input.liquidityUsd)}`);

        if (input.marketCapUsd != null && input.marketCapUsd > 0) {
            const ratio = formatLiquidityRatio(input.liquidityUsd, input.marketCapUsd);
            parts.push(`Liq/MCap ratio: ${ratio}`);
        }
    } else {
        parts.push('Liquidity data unavailable.');
    }

    parts.push(`Component score: ${Math.round(componentScore)}%`);
    return parts.join(' ');
}

function buildHolderDistributionTooltip(input: MarketScoreInput, componentScore: number): string {
    const parts: string[] = ['Measures ownership concentration among top holders.'];

    if (input.top10HoldersPercent != null) {
        parts.push(`Top 10 holders own ${input.top10HoldersPercent.toFixed(1)}% of supply.`);
    } else {
        parts.push('Holder distribution data unavailable.');
    }

    parts.push(`Component score: ${Math.round(componentScore)}%`);
    return parts.join(' ');
}

function buildTradingActivityTooltip(input: MarketScoreInput, componentScore: number): string {
    const parts: string[] = ['Measures whether volume is healthy and organic.'];

    if (input.volume7dUsd != null) {
        parts.push(`7d volume: ${formatUsdCompact(input.volume7dUsd)}`);

        if (input.liquidityUsd != null && input.liquidityUsd > 0) {
            const dailyVolumeUsd = input.volume24hUsd ?? input.volume7dUsd / 7;
            const ratio = formatVolumeToLiquidityRatio(dailyVolumeUsd, input.liquidityUsd);
            parts.push(`24h Vol/Liq ratio: ${ratio}`);
        }
    } else {
        parts.push('Volume data unavailable.');
    }

    parts.push(`Component score: ${Math.round(componentScore)}%`);
    return parts.join(' ');
}

function buildHolderCountTooltip(input: MarketScoreInput, componentScore: number): string {
    const parts: string[] = ['Counts unique wallet addresses holding this token.'];

    if (input.holderCount != null) {
        parts.push(`${formatInteger(input.holderCount)} unique holders.`);
    } else {
        parts.push('Holder count unavailable.');
    }

    parts.push(`Component score: ${Math.round(componentScore)}%`);
    return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Score Row Component
// ---------------------------------------------------------------------------

interface ScoreRowProps {
    label: string;
    value: React.ReactNode;
    status: RiskStatus;
    tooltip: string;
}

function ScoreRow({ label, value, status, tooltip }: ScoreRowProps) {
    const Icon =
        status === 'safe' ? IconCheckmark : status === 'risk' ? IconExclamationmarkTriangleFill : IconInfoCircleFill;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center justify-between gap-6 py-5 first:pt-0 last:pb-0 cursor-default">
                    <div className="text-body-lg text-text-extra-high font-medium">{label}</div>
                    <div className="flex items-center gap-3">
                        <div className="text-body-lg text-text-extra-high font-medium tabular-nums">{value}</div>
                        <div
                            className={cn(
                                'flex size-7 items-center justify-center rounded-lg border border-border-light bg-gray-50',
                                status === 'risk' && 'border-red-200 bg-red-50 text-red-700',
                                status === 'safe' && 'border-green-200 bg-green-50 text-green-700',
                                status === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
                                status === 'info' && 'text-text-medium',
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-3.5 w-3.5',
                                    status === 'risk' && 'fill-rose-600',
                                    status === 'safe' && 'fill-emerald-600',
                                    status === 'warning' && 'fill-amber-600',
                                    status === 'info' && 'fill-text-medium',
                                )}
                            />
                        </div>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent
                side="right"
                sideOffset={8}
                className="bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] max-w-[280px]"
            >
                <p className="text-pretty">{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}

// ---------------------------------------------------------------------------
// Market Score Gauge Component
// ---------------------------------------------------------------------------

interface MarketScoreGaugeProps {
    score: number | null;
    grade: string;
    tone: RiskStatus;
    label: string;
    isTrustedLaunch: boolean;
}

function MarketScoreGauge({ score, tone, label, isTrustedLaunch }: MarketScoreGaugeProps) {
    const safeScore = score == null ? 0 : clamp(score, 0, 100);
    const ratio = safeScore / 100;

    const r = 80;
    const cx = 100;
    const cy = 100;
    const arcLength = Math.PI * r;
    const dashOffset = arcLength * (1 - ratio);
    const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

    const strokeBase =
        tone === 'safe'
            ? 'stroke-emerald-200'
            : tone === 'warning'
              ? 'stroke-amber-200'
              : tone === 'risk'
                ? 'stroke-rose-200'
                : 'stroke-border-light';
    const strokeActive =
        tone === 'safe'
            ? 'stroke-emerald-600'
            : tone === 'warning'
              ? 'stroke-amber-600'
              : tone === 'risk'
                ? 'stroke-rose-600'
                : 'stroke-text-medium';
    const LabelIcon =
        tone === 'safe'
            ? IconCheckmarkShieldFill
            : tone === 'warning'
              ? IconExclamationmarkTriangleFill
              : tone === 'risk'
                ? IconExclamationmarkTriangleFill
                : IconInfoCircleFill;

    return (
        <div className="relative w-full">
            <svg viewBox="0 0 200 120" className="w-full h-auto" aria-hidden="true">
                <path d={d} fill="none" className={cn(strokeBase)} strokeWidth={8} strokeLinecap="round" />
                <path
                    d={d}
                    fill="none"
                    className={cn(strokeActive)}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} ${arcLength}`}
                    strokeDashoffset={dashOffset}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-[50px]">
                <div className="flex items-baseline gap-1 mt-[90px]">
                    <span className="text-[50px] leading-none font-medium text-text-extra-high tabular-nums">
                        {score == null ? '—' : safeScore}
                    </span>
                    <span className="text-xl text-text-low font-medium">/100</span>
                </div>
                <div className={cn('mt-10 inline-flex items-center gap-2 text-body-lg font-medium')}>
                    <LabelIcon
                        className={cn(
                            'h-3.5 w-3.5',
                            tone === 'risk' && 'fill-rose-600',
                            tone === 'warning' && 'fill-amber-600',
                            tone === 'safe' && 'fill-emerald-600',
                            tone === 'info' && 'fill-text-medium',
                        )}
                    />
                    {label}
                </div>
                {isTrustedLaunch && <div className="mt-2 text-xs text-amber-600 font-sans">Trusted Launch</div>}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Insufficient Data Display Component
// ---------------------------------------------------------------------------

interface InsufficientDataDisplayProps {
    reason: string | null;
    tags: RiskTag[];
    input: MarketScoreInput;
}

function InsufficientDataDisplay({ reason, tags, input }: InsufficientDataDisplayProps) {
    // Build a list of what data is missing
    const missingData: string[] = [];
    if (input.liquidityUsd == null || input.liquidityUsd < 1_000) {
        missingData.push('Liquidity data');
    }
    if (input.marketCapUsd == null || input.marketCapUsd < 1_000) {
        missingData.push('Market cap data');
    }
    if (input.holderCount == null) {
        missingData.push('Holder count');
    }
    if (input.top10HoldersPercent == null) {
        missingData.push('Holder distribution');
    }
    if (input.volume7dUsd == null) {
        missingData.push('Trading volume');
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="">
                        <div className="mb-4">
                            <h4 className="text-body-lg text-text-extra-high font-medium mb-2">Insufficient Data</h4>
                            <p className="text-body-md text-text-low text-pretty">
                                {reason ?? 'Not enough market data available to compute a reliable score.'}
                            </p>
                        </div>

                        {missingData.length > 0 && (
                            <div className="mb-4">
                                <p className="text-body-sm text-text-extra-low mb-2">Missing or below threshold:</p>
                                <ul className="list-disc list-inside text-body-sm text-text-low space-y-1">
                                    {missingData.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Show available data points */}
                        <div className="pt-4 border-t border-border-light">
                            <p className="text-body-sm text-text-extra-low mb-2">Available data:</p>
                            <div className="space-y-2 text-body-sm">
                                {input.liquidityUsd != null && input.liquidityUsd >= 1_000 && (
                                    <div className="flex justify-between">
                                        <span className="text-text-low">Liquidity</span>
                                        <span className="text-text-extra-high font-sans tabular-nums">
                                            {formatUsdCompact(input.liquidityUsd)}
                                        </span>
                                    </div>
                                )}
                                {input.marketCapUsd != null && input.marketCapUsd >= 1_000 && (
                                    <div className="flex justify-between">
                                        <span className="text-text-low">Market Cap</span>
                                        <span className="text-text-extra-high font-sans tabular-nums">
                                            {formatUsdCompact(input.marketCapUsd)}
                                        </span>
                                    </div>
                                )}
                                {input.volume24hUsd != null && input.volume24hUsd > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-text-low">24h Volume</span>
                                        <span className="text-text-extra-high font-sans tabular-nums">
                                            {formatUsdCompact(input.volume24hUsd)}
                                        </span>
                                    </div>
                                )}
                                {input.holderCount != null && (
                                    <div className="flex justify-between">
                                        <span className="text-text-low">Holders</span>
                                        <span className="text-text-extra-high font-sans tabular-nums">
                                            {formatInteger(input.holderCount)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <div className="text-center">
                            <IconInfoCircleFill className="h-12 w-12 fill-text-extra-low mx-auto mb-4" />
                            <div className="text-[40px] leading-none font-medium text-text-extra-low tabular-nums">
                                —
                            </div>
                            <div className="mt-1 text-sm text-text-extra-low font-sans">No Score</div>
                            <p className="mt-4 text-body-md text-text-extra-low max-w-[200px] text-pretty">
                                Market score requires sufficient liquidity and market cap data.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Still show risk factors if available */}
                {tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                        <h5 className="text-body-md text-text-extra-high font-medium mb-3">
                            Risk Factors ({tags.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {tags.slice(0, 5).map(tag => (
                                <Tooltip key={tag.key}>
                                    <TooltipTrigger asChild>
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-default',
                                                tag.severity >= 10
                                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                                    : 'bg-gray-50 text-text-medium border border-border-light',
                                            )}
                                        >
                                            {tag.name}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        sideOffset={8}
                                        className="bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] max-w-[280px]"
                                    >
                                        <p className="text-pretty">{tag.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            {tags.length > 5 && (
                                <span className="inline-flex items-center px-2.5 py-1 text-xs text-text-extra-low">
                                    +{tags.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
