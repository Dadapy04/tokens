import { NextResponse } from 'next/server';

import { isValidUtcDate } from '@/app/status/lib/status-aggregation';
import {
    getCachedStatusOverview,
    STATUS_NO_STORE_CACHE_CONTROL,
    STATUS_OVERVIEW_CACHE_CONTROL,
} from '@/app/status/lib/status-cache';
import { getStatusDay } from '@/app/status/lib/status-loki';

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const selectedDate = url.searchParams.get('date');

    if (selectedDate !== null && !isValidUtcDate(selectedDate)) {
        return NextResponse.json(
            {
                error: {
                    message: 'Invalid date. Expected YYYY-MM-DD.',
                },
            },
            {
                status: 400,
                headers: { 'Cache-Control': STATUS_NO_STORE_CACHE_CONTROL },
            },
        );
    }

    if (selectedDate === null) {
        const data = await getCachedStatusOverview();
        return NextResponse.json(data, {
            headers: { 'Cache-Control': STATUS_OVERVIEW_CACHE_CONTROL },
        });
    }

    const data = await getStatusDay(selectedDate);
    return NextResponse.json(data, {
        headers: { 'Cache-Control': STATUS_NO_STORE_CACHE_CONTROL },
    });
}
