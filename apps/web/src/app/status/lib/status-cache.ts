import 'server-only';

import { unstable_cache } from 'next/cache';

import { getStatusOverview } from './status-loki';

export const STATUS_OVERVIEW_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=120';
export const STATUS_NO_STORE_CACHE_CONTROL = 'no-store';

export const getCachedStatusOverview = unstable_cache(getStatusOverview, ['status-overview'], {
    revalidate: 60,
});
