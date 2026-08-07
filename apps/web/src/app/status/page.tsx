import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';

import { Skeleton } from '@tokens/ui/skeleton';
import { SiteFooter } from '@/components/site-footer';
import { getCachedStatusOverview } from './lib/status-cache';
import { StatusTimeline } from './status-timeline';

export const metadata: Metadata = {
    title: 'API Status | Tokens',
    description: 'Current and historical uptime for the Tokens API.',
};

export default function StatusPage() {
    return (
        <main className="min-h-dvh bg-white pt-28">
            <section className="border-b border-gray-1400/10">
                <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-6 pb-10 pt-8">
                    <p className="text-[length:var(--text-body-md-size)] font-medium text-text-medium">Tokens</p>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl">
                            <h1 className="text-[40px] font-medium leading-[1.05] text-text-extra-high md:text-[52px]">
                                API Status
                            </h1>
                            <p className="mt-4 max-w-xl text-[length:var(--text-body-lg-size)] leading-[var(--leading-normal)] text-text-medium">
                                Production availability for the public Tokens API.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Suspense fallback={<StatusTimelineFallback />}>
                <StatusTimelineLoader />
            </Suspense>

            <section className="border-t border-gray-1400/10">
                <div className="mx-auto max-w-[1120px] px-6 pb-10">
                    <SiteFooter tone="light" />
                </div>
            </section>
        </main>
    );
}

/**
 * Runs at request time (the previous `force-dynamic` behavior): `connection()`
 * keeps the Loki-backed overview out of the prerendered shell so the page
 * chrome above renders instantly while the timeline streams in.
 */
async function StatusTimelineLoader() {
    await connection();
    const initialData = await getCachedStatusOverview();
    return <StatusTimeline initialData={initialData} />;
}

function StatusTimelineFallback() {
    return (
        <section className="mx-auto max-w-[1120px] px-6 py-10">
            <Skeleton className="h-6 w-48 bg-gray-100" />
            <Skeleton className="mt-6 h-24 w-full bg-gray-100 rounded-xl" />
            <Skeleton className="mt-4 h-24 w-full bg-gray-100 rounded-xl" />
        </section>
    );
}
