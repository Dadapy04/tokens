'use client';

import { memo, useMemo } from 'react';
import { useReducedMotion } from 'motion/react';
import { Database } from 'lucide-react';
import { PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart, Label } from 'recharts';

import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/app-ui/chart';
import { Skeleton } from '@tokens/ui/skeleton';
import type { EndpointPerformance } from './dashboard-types';

interface CallDistributionDatum {
    key: string;
    endpoint: string;
    label: string;
    calls: number;
    fill: string;
}

export interface CallDistributionCardProps {
    endpointPerformance: EndpointPerformance[] | undefined;
}

const callDistributionPalette = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#14b8a6', // teal
    '#f97316', // orange
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#0ea5e9', // sky
    '#ec4899', // pink
    '#22c55e', // green
    '#eab308', // yellow
] as const;

const CallDistributionTooltipContent = memo(function CallDistributionTooltipContent({
    active,
    payload,
    totalCalls,
    seriesByKey,
}: {
    active?: boolean;
    payload?: ReadonlyArray<{ dataKey?: string; value?: number }>;
    totalCalls: number;
    seriesByKey: Record<string, CallDistributionDatum>;
}) {
    if (!active || !payload?.length) return null;

    const key = payload[0]?.dataKey;
    const value = payload[0]?.value;

    const data = key ? seriesByKey[key] : undefined;
    if (!data) return null;

    const calls = typeof value === 'number' ? value : data.calls;
    const percentage = totalCalls > 0 ? ((calls / totalCalls) * 100).toFixed(1) : '0.0';

    return (
        <div className="flex flex-col gap-0.5 overflow-hidden bg-background/95 backdrop-blur-sm border border-black/[0.15] rounded-lg shadow-lg">
            <div className="px-3 pb-1.5 pt-2">
                <div className="mb-2 flex items-center gap-2">
                    <Database className="h-3 w-3 text-neutral-500" />
                    <span className="font-berkeley-mono text-xs text-text-high">Call Distribution</span>
                </div>
                <div className="text-xs text-neutral-500 mb-2 break-all">{data.endpoint}</div>
                <div className="flex items-center gap-2 py-0.5">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: data.fill }} />
                    <span className="font-mono text-sm">{calls.toLocaleString()}</span>
                    <span className="text-xs text-neutral-500">{percentage}%</span>
                </div>
            </div>
            <div className="my-1 h-[1px] w-full scale-110 bg-neutral-200 dark:bg-neutral-800" />
            <div className="px-3 pb-2 pt-1.5">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{totalCalls.toLocaleString()}</span>
                    <span className="text-xs text-neutral-500">Total Calls</span>
                </div>
            </div>
        </div>
    );
});

export const CallDistributionCard = memo(function CallDistributionCard({
    endpointPerformance,
}: CallDistributionCardProps) {
    const shouldReduceMotion = useReducedMotion();

    const {
        callDistributionData,
        callDistributionTotal,
        callDistributionSeriesByKey,
        callDistributionConfig,
        radialDistributionData,
    } = useMemo(() => {
        const callDistributionData: Array<CallDistributionDatum> = (endpointPerformance ?? [])
            .filter(row => row.calls > 0)
            .map((row, index) => ({
                key: `type_${index}`,
                endpoint: row.endpoint,
                label: row.endpoint,
                calls: row.calls,
                fill: callDistributionPalette[index % callDistributionPalette.length] ?? '#3b82f6',
            }));

        const callDistributionTotal = callDistributionData.reduce((sum, row) => sum + row.calls, 0);
        const callDistributionSeriesByKey: Record<string, CallDistributionDatum> = Object.fromEntries(
            callDistributionData.map(row => [row.key, row]),
        );

        const callDistributionConfig: ChartConfig = Object.fromEntries(
            callDistributionData.map(row => [row.key, { label: row.label, color: row.fill }]),
        );

        const radialDistributionData =
            callDistributionData.length > 0
                ? ([
                      Object.fromEntries(callDistributionData.map(row => [row.key, row.calls])) as Record<
                          string,
                          number
                      >,
                  ] satisfies Array<Record<string, number>>)
                : [];

        return {
            callDistributionData,
            callDistributionTotal,
            callDistributionSeriesByKey,
            callDistributionConfig,
            radialDistributionData,
        };
    }, [endpointPerformance]);

    return (
        <div className="space-y-4 col-span-2">
            <div className="flex items-center gap-2">
                <div>
                    <h4 className="font-medium">Call Distribution</h4>
                    <p className="text-sm text-muted-foreground">Breakdown of API call types</p>
                </div>
            </div>

            <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
                <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-4px_30px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-4px_30px_rgba(47,44,48,0.9),0_4px_16px_rgba(0,0,0,0.6)]">
                    {/* Chart Content */}
                    <div className="p-6 pb-4 relative">
                        <div
                            className="absolute inset-0 z-0 size-full opacity-40 dark:opacity-50 mask-t-from-50% mask-b-from-50% mask-l-from-50% mask-r-from-50%"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'repeat',
                            }}
                        />
                        {endpointPerformance === undefined ? (
                            <div className="relative z-10">
                                <Skeleton className="h-[200px] w-full" />
                            </div>
                        ) : callDistributionData.length > 0 ? (
                            <div className="relative z-10">
                                <ChartContainer
                                    config={callDistributionConfig}
                                    className="mx-auto aspect-square max-h-[200px]"
                                >
                                    <RadialBarChart
                                        data={radialDistributionData}
                                        startAngle={90}
                                        endAngle={450}
                                        innerRadius={60}
                                        outerRadius={100}
                                    >
                                        <PolarAngleAxis
                                            type="number"
                                            domain={[0, Math.max(1, callDistributionTotal)]}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={({ active, payload }) => (
                                                <CallDistributionTooltipContent
                                                    active={active}
                                                    payload={
                                                        payload as unknown as ReadonlyArray<{
                                                            dataKey?: string;
                                                            value?: number;
                                                        }>
                                                    }
                                                    totalCalls={callDistributionTotal}
                                                    seriesByKey={callDistributionSeriesByKey}
                                                />
                                            )}
                                        />
                                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                            >
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className="fill-foreground text-2xl font-bold font-mono"
                                                                >
                                                                    {callDistributionTotal.toLocaleString()}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy || 0) + 20}
                                                                    className="fill-muted-foreground text-xs"
                                                                >
                                                                    Total Calls
                                                                </tspan>
                                                            </text>
                                                        );
                                                    }
                                                }}
                                            />
                                        </PolarRadiusAxis>
                                        {callDistributionData.map(row => (
                                            <RadialBar
                                                key={row.key}
                                                dataKey={row.key}
                                                stackId="a"
                                                cornerRadius={5}
                                                fill={row.fill}
                                                className="stroke-white dark:stroke-zinc-900 stroke-4"
                                                isAnimationActive={!shouldReduceMotion}
                                                animationDuration={shouldReduceMotion ? 0 : 250}
                                                animationEasing="ease-out"
                                            />
                                        ))}
                                    </RadialBarChart>
                                </ChartContainer>
                            </div>
                        ) : (
                            <div className="relative z-10 flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                                No call distribution data available yet.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-black/[0.15] bg-muted/20">
                        <div className="flex w-full items-start gap-2 text-sm">
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2 leading-none font-medium">
                                    {endpointPerformance === undefined ? (
                                        <Skeleton className="h-10 w-52" />
                                    ) : callDistributionData.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 max-h-[120px] overflow-auto pr-2">
                                            {callDistributionData.map(row => {
                                                const pct =
                                                    callDistributionTotal > 0
                                                        ? (row.calls / callDistributionTotal) * 100
                                                        : 0;

                                                return (
                                                    <div
                                                        key={row.endpoint}
                                                        className="flex items-center justify-between gap-3"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div
                                                                className="w-2 h-2 rounded-full shrink-0"
                                                                style={{ backgroundColor: row.fill }}
                                                            />
                                                            <span className="text-xs truncate">{row.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                                {pct.toFixed(1)}%
                                                            </span>
                                                            <span className="text-xs font-mono tabular-nums">
                                                                {row.calls.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground">No call data yet</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
