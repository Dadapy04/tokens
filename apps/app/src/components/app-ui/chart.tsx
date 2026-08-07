'use client';

import * as React from 'react';
import { ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { cn } from '@/lib/utils';

export interface ChartConfig {
    [key: string]: {
        label: string;
        color: string;
    };
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    config: ChartConfig;
    children: React.ReactNode;
}

export function ChartContainer({ config, className, children, style, ...props }: ChartContainerProps) {
    const cssVars = Object.fromEntries(Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color]));

    return (
        <div
            className={cn('w-full', className)}
            style={{ ...(cssVars as React.CSSProperties), ...(style ?? {}) }}
            {...props}
        >
            <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
    );
}

export function ChartTooltip(props: React.ComponentProps<typeof RechartsTooltip>) {
    return <RechartsTooltip {...props} />;
}
