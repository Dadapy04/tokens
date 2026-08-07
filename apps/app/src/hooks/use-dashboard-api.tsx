'use client';

/**
 * Fetch-based dashboard data layer replacing the Convex React client.
 *
 * All calls POST to `/api/dashboard/[fn]` (Clerk-session-verified server
 * route that talks to cloudrun-usage or Convex). Convex live queries degrade
 * to refetch-on-mutation + optional interval polling: every mutation
 * invalidates the whole `['dashboard']` key space, which is cheap at this
 * surface's size and matches the "UI catches up after writes" behavior the
 * components were built around.
 */

import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    QueryClient,
    QueryClientProvider,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

export class DashboardApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
        this.name = 'DashboardApiError';
    }
}

export async function callDashboard<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(`/api/dashboard/${encodeURIComponent(fn)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
    });
    if (!res.ok) {
        let message = `Dashboard request failed (${res.status})`;
        try {
            const body = (await res.json()) as { error?: { message?: string } };
            if (body?.error?.message) message = body.error.message;
        } catch {
            // keep default message
        }
        throw new DashboardApiError(message, res.status);
    }
    return (await res.json()) as T;
}

export function DashboardApiProvider({ children }: { children: React.ReactNode }) {
    const [client] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 10_000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export interface UseDashboardQueryOptions {
    /** Skip the query entirely (mirrors Convex's `'skip'`). */
    enabled?: boolean;
    /** Poll interval in ms (usage charts use 30s). */
    refetchIntervalMs?: number;
}

/**
 * Query hook. Returns `undefined` while loading (mirrors Convex `useQuery`)
 * and `null`/data as returned by the backend.
 */
export function useDashboardQuery<T>(
    fn: string,
    args: Record<string, unknown> | 'skip',
    options: UseDashboardQueryOptions = {},
): { data: T | undefined; error: Error | null; isLoading: boolean; refetch: () => void } {
    const { isLoaded, isSignedIn } = useAuth();
    const skip = args === 'skip' || options.enabled === false || !isLoaded || !isSignedIn;
    const queryArgs = args === 'skip' ? {} : args;

    const result = useQuery<T, Error>({
        queryKey: ['dashboard', fn, queryArgs],
        queryFn: () => callDashboard<T>(fn, queryArgs),
        enabled: !skip,
        ...(options.refetchIntervalMs ? { refetchInterval: options.refetchIntervalMs } : {}),
    });

    return {
        data: result.data,
        error: result.error ?? null,
        isLoading: result.isLoading,
        refetch: () => void result.refetch(),
    };
}

/**
 * Mutation hook. Returns an async callable (mirrors Convex `useMutation`/`useAction`).
 * On success, invalidates all dashboard queries so lists/stats catch up.
 */
export function useDashboardMutation<TResult = unknown, TArgs extends Record<string, unknown> = Record<string, unknown>>(
    fn: string,
): (args?: TArgs) => Promise<TResult> {
    const queryClient = useQueryClient();
    const mutation = useMutation<TResult, Error, TArgs | undefined>({
        mutationFn: args => callDashboard<TResult>(fn, args ?? {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
    // `mutateAsync` is referentially stable across renders (unlike the mutation
    // result object, which changes identity on every state transition), so the
    // returned callable is safe to list in useEffect deps.
    const { mutateAsync } = mutation;
    return React.useCallback((args?: TArgs) => mutateAsync(args), [mutateAsync]);
}

/** Invalidate all dashboard queries (imperative escape hatch). */
export function useInvalidateDashboard(): () => void {
    const queryClient = useQueryClient();
    return React.useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }, [queryClient]);
}
