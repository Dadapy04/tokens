import posthog from 'posthog-js';

// Client-side PostHog init. Runs once before the app hydrates (Next.js
// instrumentation-client). Without this, all posthog.capture calls are dropped.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const isPosthogDebugEnabled =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true';

if (posthogKey) {
    posthog.init(posthogKey, {
        // First-party proxy — /ingest rewrites to PostHog in next.config.ts.
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        defaults: '2025-11-30',
        capture_exceptions: true,
        person_profiles: 'identified_only',
        capture_pageview: 'history_change',
        // Our RUM: web vitals autocapture (TTFB/LCP/CLS/INP) shipped through
        // the first-party /ingest proxy.
        capture_performance: { web_vitals: true },
        ...(isPosthogDebugEnabled ? { debug: true } : {}),
    });
}
