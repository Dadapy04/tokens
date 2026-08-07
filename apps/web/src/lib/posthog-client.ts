'use client';

import posthog from 'posthog-js';

export type PosthogCaptureProperties = Record<string, unknown>;

const hasPosthogKey = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

export function trackEvent(event: string, properties?: PosthogCaptureProperties) {
    if (!hasPosthogKey) return;
    posthog.capture(event, properties);
}
