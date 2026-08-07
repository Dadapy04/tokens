'use client';

import * as React from 'react';
import Link from 'next/link';

import { trackEvent } from '@/lib/posthog-client';

interface TrackingProps {
    /** PostHog event name, e.g. 'external_link_clicked' or 'nav_link_clicked'. */
    trackingEvent: string;
    /** Snake_case properties to send with the event. */
    trackingProperties?: Record<string, unknown>;
}

type TrackedLinkProps = React.ComponentPropsWithoutRef<typeof Link> & TrackingProps;

/**
 * Drop-in replacement for next/link that fires a PostHog event on click.
 * Safe to render from server components (this file is the client boundary).
 */
export function TrackedLink({ trackingEvent, trackingProperties, onClick, ...props }: TrackedLinkProps) {
    return (
        <Link
            {...props}
            onClick={event => {
                trackEvent(trackingEvent, trackingProperties);
                onClick?.(event);
            }}
        />
    );
}

type TrackedAnchorProps = React.ComponentPropsWithoutRef<'a'> & TrackingProps;

/**
 * Drop-in replacement for a plain <a> (e.g. outbound target="_blank" links)
 * that fires a PostHog event on click. Safe to render from server components.
 */
export function TrackedAnchor({ trackingEvent, trackingProperties, onClick, href, ...props }: TrackedAnchorProps) {
    return (
        <a
            {...props}
            href={href}
            onClick={event => {
                trackEvent(trackingEvent, trackingProperties);
                onClick?.(event);
            }}
        />
    );
}
