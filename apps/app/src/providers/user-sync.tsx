'use client';

import * as React from 'react';
import { useAuth } from '@clerk/nextjs';

import { useDashboardMutation, useDashboardQuery } from '@/hooks/use-dashboard-api';
import type { UserDoc } from '@/lib/dashboard-types';

/**
 * Ensures a `users` row exists for the signed-in Clerk user (replaces
 * ConvexUserSync). Runs once per session; the failure latch prevents retry
 * storms if the backend is down.
 */
export function UserSync() {
    const { isLoaded, isSignedIn } = useAuth();
    const { data: me } = useDashboardQuery<UserDoc | null>('usersGetMe', isLoaded && isSignedIn ? {} : 'skip');
    const upsertMe = useDashboardMutation<string>('usersUpsertMe');
    const [syncFailed, setSyncFailed] = React.useState(false);

    const hasSyncedOnce = React.useRef(false);

    React.useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        if (me === undefined) return; // still loading
        if (me !== null) return;
        if (syncFailed) return;
        if (hasSyncedOnce.current) return;
        hasSyncedOnce.current = true;

        void upsertMe({}).catch(error => {
            hasSyncedOnce.current = false;
            setSyncFailed(true);
            console.error('Failed to sync user', error);
        });
    }, [isLoaded, isSignedIn, me, syncFailed, upsertMe]);

    return null;
}
