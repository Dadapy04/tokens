'use client';

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import { Liveline, type HoverPoint, type LivelinePoint } from 'liveline';

import type { ChartConfig } from '@/components/app-ui/chart';
import type { ChartData } from './dashboard-types';

interface UsageTrendTooltipState {
    leftPx: number;
    dateLabel: string;
    apiCalls: number | null;
}

export interface UsageTrendCardProps {
    chartData: ChartData[];
}

const WINDOW_BUFFER_NO_BADGE = 0.015;

const lineChartConfig = {
    apiCalls: {
        label: 'API Calls',
        color: '#3b82f6',
    },
} satisfies ChartConfig;

const UsageTrendTooltipContent = memo(function UsageTrendTooltipContent({
    dateLabel,
    apiCalls,
}: {
    dateLabel: string;
    apiCalls: number | null;
}) {
    return (
        <div className="flex flex-col gap-0.5 overflow-hidden bg-white/95 backdrop-blur-sm border border-border-medium rounded-lg shadow-lg">
            <div className="px-3 pb-1.5 pt-2">
                <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-text-medium" />
                    <span className="font-berkeley-mono text-xs text-text-high">Usage Metrics</span>
                </div>
                <div className="text-xs text-text-medium mb-2">{dateLabel}</div>
                {typeof apiCalls === 'number' && (
                    <div className="flex items-center gap-2 py-0.5">
                        <div
                            className="h-2 w-2 rounded-sm"
                            style={{ backgroundColor: lineChartConfig.apiCalls.color }}
                        />
                        <span className="font-berkeley-mono text-sm">{apiCalls.toLocaleString()}</span>
                        <span className="text-xs text-text-medium">API Calls</span>
                    </div>
                )}
            </div>
        </div>
    );
});

export const UsageTrendCard = memo(function UsageTrendCard({ chartData }: UsageTrendCardProps) {
    const shouldReduceMotion = useReducedMotion();

    // Calculate trends
    const usageTrendChartHostRef = useRef<HTMLDivElement>(null);
    const lastUsageTrendHoverRef = useRef<{ x: number; t: number } | null>(null);
    const [usageTrendTooltip, setUsageTrendTooltip] = useState<UsageTrendTooltipState | null>(null);

    const { usageWindowSecs, usageTimeOffsetSec, apiCallsPoints, totalApiCalls } = useMemo(() => {
        const raw = chartData
            .map(row => {
                const time = dateKeyUtcToTimeSec(row.date);
                if (time === null) return null;
                return {
                    time,
                    apiCalls: Number.isFinite(row.apiCalls) ? row.apiCalls : 0,
                };
            })
            .filter((row): row is { time: number; apiCalls: number } => row !== null)
            .sort((a, b) => a.time - b.time);

        const apiCallsPointsRaw: LivelinePoint[] = raw.map(row => ({ time: row.time, value: row.apiCalls }));
        const totalApiCalls = raw.reduce((sum, row) => sum + row.apiCalls, 0);

        const span = apiCallsPointsRaw.length >= 2 ? apiCallsPointsRaw.at(-1)!.time - apiCallsPointsRaw[0]!.time : 60;

        const windowSecs = Math.ceil(span / (1 - WINDOW_BUFFER_NO_BADGE));

        const lastTime = apiCallsPointsRaw.at(-1)?.time ?? null;
        const nowSec = Math.floor(Date.now() / 1000);

        // Shift points so the last bucket is at the chart's right edge (not "now"), which prevents
        // the first bucket from immediately scrolling off after mount.
        const offsetSec = lastTime !== null ? Math.max(0, nowSec - lastTime + windowSecs * WINDOW_BUFFER_NO_BADGE) : 0;

        const apiCallsPointsShifted = apiCallsPointsRaw.map(p => ({ time: p.time + offsetSec, value: p.value }));

        return {
            usageWindowSecs: Math.max(60, windowSecs),
            usageTimeOffsetSec: offsetSec,
            apiCallsPoints: apiCallsPointsShifted,
            totalApiCalls,
        };
    }, [chartData]);

    const chartValue = apiCallsPoints.at(-1)?.value ?? 0;

    const handleUsageTrendHover = useCallback(
        (point: HoverPoint | null) => {
            const host = usageTrendChartHostRef.current;
            if (!host) return;

            if (!point) {
                lastUsageTrendHoverRef.current = null;
                setUsageTrendTooltip(null);
                return;
            }

            const x = Math.round(point.x);
            const t = Math.round(point.time);
            const prev = lastUsageTrendHoverRef.current;
            if (prev && prev.x === x && prev.t === t) return;
            lastUsageTrendHoverRef.current = { x, t };

            const closestApiCalls = findClosestPoint(apiCallsPoints, point.time);
            const apiCalls = closestApiCalls?.value ?? null;
            const closestTimeSec = closestApiCalls?.time ?? point.time;

            const rect = host.getBoundingClientRect();
            const TOOLTIP_WIDTH = 240;
            const leftPx = clampNumber(x + 12, 8, Math.max(8, rect.width - TOOLTIP_WIDTH - 8));

            setUsageTrendTooltip({
                leftPx,
                dateLabel: formatDateLabelUtc(closestTimeSec - usageTimeOffsetSec),
                apiCalls,
            });
        },
        [apiCallsPoints, usageTimeOffsetSec],
    );

    return (
        <div className="will-change-auto transform-gpu col-span-2">
            {/* Header */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between pb-6">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-text-extra-high font-inter-semibold text-sm">Usage Trend</span>
                        <span className="text-text-low text-xs">last 30 days</span>
                    </div>

                    <div className="flex flex-wrap items-end gap-6">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-2 w-2 rounded-sm"
                                    style={{ backgroundColor: lineChartConfig.apiCalls.color }}
                                />
                                <span className="text-[11px] font-berkeley-mono text-text-low">API Calls</span>
                            </div>
                            <span className="text-2xl sm:text-3xl font-inter-semibold text-text-extra-high tabular-nums leading-none">
                                {totalApiCalls.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
                <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-4px_30px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-4px_30px_rgba(47,44,48,0.9),0_4px_16px_rgba(0,0,0,0.6)]">
                    {/* Chart */}
                    <div className="relative z-10 px-2 py-4">
                        <div
                            ref={usageTrendChartHostRef}
                            className="w-full relative"
                            style={{ contain: 'layout style paint' }}
                        >
                            {usageTrendTooltip && (
                                <div
                                    className="absolute z-20 pointer-events-none"
                                    style={{ top: 8, left: usageTrendTooltip.leftPx, width: 240 }}
                                >
                                    <UsageTrendTooltipContent
                                        dateLabel={usageTrendTooltip.dateLabel}
                                        apiCalls={usageTrendTooltip.apiCalls}
                                    />
                                </div>
                            )}

                            <Liveline
                                data={apiCallsPoints}
                                value={chartValue}
                                window={usageWindowSecs}
                                theme="light"
                                color={lineChartConfig.apiCalls.color}
                                grid={false}
                                badge={false}
                                momentum={false}
                                scrub
                                cursor="crosshair"
                                pulse={false}
                                lineWidth={2}
                                lerpSpeed={shouldReduceMotion ? 1 : undefined}
                                padding={{ top: 12, bottom: 28, left: 12 }}
                                formatValue={v => Math.round(v).toLocaleString()}
                                formatTime={t => {
                                    const d = new Date((t - usageTimeOffsetSec) * 1000);
                                    return d.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        timeZone: 'UTC',
                                    });
                                }}
                                tooltipY={-1000}
                                tooltipOutline={false}
                                onHover={handleUsageTrendHover}
                                className="min-h-[240px] w-full will-change-auto transform-gpu"
                                style={{ height: 240, minHeight: '240px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

function clampNumber(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function dateKeyUtcToTimeSec(dateKey: string): number | null {
    const [yy, mm, dd] = dateKey.split('-').map(Number);
    if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
    // Convex rollups are keyed by UTC day (YYYY-MM-DD)
    return Math.floor(Date.UTC(yy, Math.max(0, mm - 1), dd, 0, 0, 0, 0) / 1000);
}

function formatDateLabelUtc(timeSec: number): string {
    const date = new Date(timeSec * 1000);
    return date.toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' });
}

function findClosestPoint(points: LivelinePoint[], timeSec: number): LivelinePoint | null {
    if (points.length === 0) return null;
    if (!Number.isFinite(timeSec)) return null;

    let lo = 0;
    let hi = points.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (points[mid]!.time < timeSec) lo = mid + 1;
        else hi = mid;
    }

    const afterIdx = lo;
    const beforeIdx = Math.max(0, afterIdx - 1);
    const after = points[afterIdx]!;
    const before = points[beforeIdx]!;
    if (beforeIdx === afterIdx) return after;
    return Math.abs(after.time - timeSec) < Math.abs(timeSec - before.time) ? after : before;
}
