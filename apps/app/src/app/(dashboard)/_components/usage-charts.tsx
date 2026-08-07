'use client';

import { memo } from 'react';

import { Skeleton } from '@tokens/ui/skeleton';
import type { ChartData, EndpointPerformance, UsageStats } from './dashboard-types';
import { UsageTrendCard } from './usage-trend-card';
import { CallDistributionCard } from './call-distribution-card';
import { EndpointPerformanceCard } from './endpoint-performance-card';

interface UsageChartsProps {
    chartData: ChartData[] | undefined;
    usageStats: UsageStats | null | undefined;
    endpointPerformance: EndpointPerformance[] | undefined;
}

const ChartSkeleton = ({ title, description }: { title: string; description: string }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div>
                <h4 className="font-medium">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>

        <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
            <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg shadow-sm overflow-hidden p-6">
                <Skeleton className="h-[200px] w-full" />
            </div>
        </div>
    </div>
);

export const UsageCharts = memo(function UsageCharts({ chartData, usageStats, endpointPerformance }: UsageChartsProps) {
    if (!chartData || !usageStats) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartSkeleton title="Usage Trend" description="API calls over time" />
                <ChartSkeleton title="Call Distribution" description="Breakdown of API call types" />
                <ChartSkeleton title="Endpoint Performance" description="Response times by API endpoint" />
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <UsageTrendCard chartData={chartData} />
                <CallDistributionCard endpointPerformance={endpointPerformance} />
                <EndpointPerformanceCard endpointPerformance={endpointPerformance} usageStats={usageStats} />
            </div>
        </>
    );
});
