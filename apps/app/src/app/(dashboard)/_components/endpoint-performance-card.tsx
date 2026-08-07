'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import {
    type ColumnDef,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Info, Minus } from 'lucide-react';

import type { EndpointPerformance, UsageStats } from './dashboard-types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@tokens/ui/tooltip';

export interface EndpointPerformanceCardProps {
    endpointPerformance: EndpointPerformance[] | undefined;
    usageStats: UsageStats;
}

const performanceZones: Record<EndpointPerformance['zone'], { color: string; label: string }> = {
    excellent: { color: '#10b981', label: 'Excellent' },
    good: { color: '#3b82f6', label: 'Good' },
    acceptable: { color: '#f59e0b', label: 'Acceptable' },
    slow: { color: '#ef4444', label: 'Slow' },
};

const columnHelper = createColumnHelper<EndpointPerformance>();

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
    if (!direction) return null;
    if (direction === 'asc') return <ChevronUp className="h-3.5 w-3.5" />;
    return <ChevronDown className="h-3.5 w-3.5" />;
}

function ColumnHeaderInfo({ columnLabel, children }: { columnLabel: string; children: React.ReactNode }) {
    return (
        <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    aria-label={`Explain ${columnLabel} column`}
                    className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    <Info className="h-3.5 w-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] bg-zinc-800 dark:bg-zinc-900 rounded-sm py-1.5 px-2">
                <p className="text-xs text-white leading-snug text-pretty">{children}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export const EndpointPerformanceCard = memo(function EndpointPerformanceCard({
    endpointPerformance,
    usageStats,
}: EndpointPerformanceCardProps) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const callsFormatter = useMemo(() => new Intl.NumberFormat(), []);

    const getTrendIcon = useCallback((trend: EndpointPerformance['trend']) => {
        switch (trend) {
            case 'improving':
                return <ArrowDown className="h-3 w-3 text-emerald-500" />;
            case 'degrading':
                return <ArrowUp className="h-3 w-3 text-red-500" />;
            default:
                return <Minus className="h-3 w-3 text-gray-500" />;
        }
    }, []);

    const getTrendLabel = useCallback((trend: EndpointPerformance['trend']) => {
        switch (trend) {
            case 'improving':
                return 'Improving';
            case 'degrading':
                return 'Degrading';
            default:
                return 'Stable';
        }
    }, []);

    const data = useMemo(() => endpointPerformance ?? [], [endpointPerformance]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns = useMemo<Array<ColumnDef<EndpointPerformance, any>>>(
        () => [
            columnHelper.accessor('endpoint', {
                id: 'endpoint',
                header: 'Endpoint',
                enableSorting: true,
                sortingFn: 'alphanumeric',
                cell: info => {
                    const endpoint = info.getValue();
                    const zone = info.row.original.zone;
                    return (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: performanceZones[zone].color }}
                            />
                            <span className="font-mono text-xs truncate">{endpoint}</span>
                        </div>
                    );
                },
            }),
            columnHelper.accessor('avgTime', {
                id: 'avgTime',
                header: 'Avg Time',
                enableSorting: true,
                cell: info => {
                    const avgTimeMs = info.getValue();
                    const p95Ms = info.row.original.p95;

                    return (
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-xs tabular-nums">{avgTimeMs}ms</span>
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground tabular-nums">
                                p95 {p95Ms}ms
                            </span>
                        </div>
                    );
                },
            }),
            columnHelper.accessor('calls', {
                id: 'calls',
                header: 'Calls',
                enableSorting: true,
                cell: info => <span className="text-xs">{callsFormatter.format(info.getValue())}</span>,
            }),
            columnHelper.accessor('trend', {
                id: 'trend',
                header: 'Trend',
                enableSorting: false,
                cell: info => {
                    const trend = info.getValue();
                    return (
                        <div className="flex items-center justify-end gap-1">
                            {getTrendIcon(trend)}
                            <span className="text-xs">{getTrendLabel(trend)}</span>
                        </div>
                    );
                },
            }),
        ],
        [callsFormatter, getTrendIcon, getTrendLabel],
    );

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getRowId: row => row.endpoint,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const endpointColumn = table.getColumn('endpoint');
    const avgTimeColumn = table.getColumn('avgTime');
    const callsColumn = table.getColumn('calls');

    const endpointSortDirection = endpointColumn?.getIsSorted() ?? false;
    const avgTimeSortDirection = avgTimeColumn?.getIsSorted() ?? false;
    const callsSortDirection = callsColumn?.getIsSorted() ?? false;

    return (
        <div className="space-y-4 col-span-1 lg:col-span-4">
            <div className="flex items-center gap-2">
                <div>
                    <h4 className="font-medium">Endpoint Performance</h4>
                    <p className="text-sm text-muted-foreground">Response times by API endpoint</p>
                </div>
            </div>

            <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
                {endpointPerformance && endpointPerformance.length > 0 ? (
                    <>
                        {/* Header - moved outside the white container */}
                        <div className="px-3 py-2">
                            <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground uppercase tracking-wide">
                                <div className="col-span-5 text-left flex items-center gap-2">
                                    <button
                                        type="button"
                                        className={`inline-flex items-center gap-1 ${
                                            endpointColumn?.getCanSort()
                                                ? 'cursor-pointer hover:text-foreground select-none'
                                                : ''
                                        }`}
                                        onClick={endpointColumn?.getToggleSortingHandler()}
                                        disabled={!endpointColumn?.getCanSort()}
                                    >
                                        Endpoint
                                        {endpointColumn?.getCanSort() && endpointSortDirection ? (
                                            <span className="text-muted-foreground/70">
                                                <SortIcon direction={endpointSortDirection} />
                                            </span>
                                        ) : null}
                                    </button>
                                    <ColumnHeaderInfo columnLabel="Endpoint">
                                        The API route bucket this row aggregates over. The dot color is a performance
                                        zone based on Avg Time (rounded): Excellent &lt;100ms, Good 100–300ms,
                                        Acceptable 300–600ms, Slow ≥600ms.
                                    </ColumnHeaderInfo>
                                </div>
                                <div className="col-span-3 text-center flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        className={`inline-flex items-center justify-center gap-1 ${
                                            avgTimeColumn?.getCanSort()
                                                ? 'cursor-pointer hover:text-foreground select-none'
                                                : ''
                                        }`}
                                        onClick={avgTimeColumn?.getToggleSortingHandler()}
                                        disabled={!avgTimeColumn?.getCanSort()}
                                    >
                                        Avg Time
                                        {avgTimeColumn?.getCanSort() && avgTimeSortDirection ? (
                                            <span className="text-muted-foreground/70">
                                                <SortIcon direction={avgTimeSortDirection} />
                                            </span>
                                        ) : null}
                                    </button>
                                    <ColumnHeaderInfo columnLabel="Avg Time">
                                        Average response time (ms) for this endpoint over the current window. Computed
                                        as total latency sum ÷ call count (rounded). The “p95” chip is the 95th
                                        percentile latency from the latency histogram.
                                    </ColumnHeaderInfo>
                                </div>
                                <div className="col-span-2 text-center flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        className={`inline-flex items-center justify-center gap-1 ${
                                            callsColumn?.getCanSort()
                                                ? 'cursor-pointer hover:text-foreground select-none'
                                                : ''
                                        }`}
                                        onClick={callsColumn?.getToggleSortingHandler()}
                                        disabled={!callsColumn?.getCanSort()}
                                    >
                                        Calls
                                        {callsColumn?.getCanSort() && callsSortDirection ? (
                                            <span className="text-muted-foreground/70">
                                                <SortIcon direction={callsSortDirection} />
                                            </span>
                                        ) : null}
                                    </button>
                                    <ColumnHeaderInfo columnLabel="Calls">
                                        Total number of calls for this endpoint over the current window. The table shows
                                        the top endpoints by call volume.
                                    </ColumnHeaderInfo>
                                </div>
                                <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                    Trend
                                    <ColumnHeaderInfo columnLabel="Trend">
                                        Compares Avg Time between the first half vs the most recent half of the window.
                                        Improving means ≥10% faster, degrading means ≥10% slower, otherwise stable.
                                    </ColumnHeaderInfo>
                                </div>
                            </div>
                        </div>

                        {/* Rows - now in separate white container */}
                        <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.25] rounded-lg shadow-sm overflow-hidden">
                            <div className="divide-y divide-border/50">
                                {table.getRowModel().rows.map(row => (
                                    <div key={row.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                                        <div className="grid grid-cols-12 gap-2 items-center">
                                            {row.getVisibleCells().map(cell => {
                                                const columnId = cell.column.id;
                                                const cellClassName =
                                                    columnId === 'endpoint'
                                                        ? 'col-span-5'
                                                        : columnId === 'avgTime'
                                                          ? 'col-span-3 text-center'
                                                          : columnId === 'calls'
                                                            ? 'col-span-2 text-center'
                                                            : 'col-span-2 text-right';

                                                return (
                                                    <div key={cell.id} className={cellClassName}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="px-4 py-3">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>Excellent (&lt;100ms)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Good (100-300ms)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>Acceptable (300ms+)</span>
                                    </div>
                                </div>
                                <span className="text-muted-foreground">
                                    Avg response time: {usageStats.averageResponseTime}ms
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* No Data State */
                    <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="text-muted-foreground text-sm">
                                No endpoint performance data available yet.
                                <br />
                                <span className="text-xs">Data will appear once API calls are made.</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
