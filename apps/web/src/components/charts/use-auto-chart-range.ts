import { useCallback, useDeferredValue, useMemo, useState, useTransition } from 'react';
import { pickIntervalForDays, TIME_RANGES } from './price-chart-utils';

export function useAutoChartRange(options: { onTimeRangeChanged: (next: number, previous: number) => void }) {
    const [isPending, startTransition] = useTransition();
    const [timeRange, setTimeRangeState] = useState(7);
    const deferredTimeRange = useDeferredValue(timeRange);
    const interval = useMemo(() => pickIntervalForDays(deferredTimeRange), [deferredTimeRange]);

    const handleTimeRangeChange = useCallback(
        (range: number) => {
            startTransition(() => {
                setTimeRangeState(range);
                options.onTimeRangeChanged(range, timeRange);
            });
        },
        [options, timeRange],
    );

    return {
        interval,
        timeRange,
        deferredTimeRange,
        isPending,
        handleTimeRangeChange,
        timeframeLabel: TIME_RANGES.find(r => r.days === timeRange)?.label ?? `${timeRange}D`,
    };
}
