'use client';

/**
 * Fetch-based curation data layer replacing the Convex React client
 * (clean break — no Convex fallback in the admin app).
 *
 * Calls POST `/api/admin/[name]` (Clerk-session + allowlist verified server
 * route → cloudrun-admin / cloudrun-assets). Convex reactivity degrades to
 * invalidate-on-mutation over the `['admin']` key space.
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

export class AdminApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
        this.name = 'AdminApiError';
    }
}

export async function callAdmin<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(`/api/admin/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
    });
    if (!res.ok) {
        let message = `Admin request failed (${res.status})`;
        try {
            const body = (await res.json()) as { error?: { message?: string } };
            if (body?.error?.message) message = body.error.message;
        } catch {
            // keep default
        }
        throw new AdminApiError(message, res.status);
    }
    return (await res.json()) as T;
}

export function AdminApiProvider({ children }: { children: React.ReactNode }) {
    const [client] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false },
                },
            }),
    );
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Query hook; returns `undefined` while loading (mirrors Convex useQuery). */
export function useAdminQuery<T>(
    name: string,
    args: Record<string, unknown> | 'skip',
): { data: T | undefined; error: Error | null; isLoading: boolean; refetch: () => void } {
    const { isLoaded, isSignedIn } = useAuth();
    const skip = args === 'skip' || !isLoaded || !isSignedIn;
    const queryArgs = args === 'skip' ? {} : args;

    const result = useQuery<T, Error>({
        queryKey: ['admin', name, queryArgs],
        queryFn: () => callAdmin<T>(name, queryArgs),
        enabled: !skip,
    });

    return {
        data: result.data,
        error: result.error ?? null,
        isLoading: result.isLoading,
        refetch: () => void result.refetch(),
    };
}

/** `/api/admin/is-admin` — replaces the Convex isAdmin query. */
export function useIsAdmin(): boolean | undefined {
    const { isLoaded, isSignedIn } = useAuth();
    const result = useQuery<{ isAdmin: boolean }, Error>({
        queryKey: ['admin', 'is-admin'],
        queryFn: async () => {
            const res = await fetch('/api/admin/is-admin');
            if (!res.ok) throw new AdminApiError(`is-admin failed (${res.status})`, res.status);
            return (await res.json()) as { isAdmin: boolean };
        },
        enabled: Boolean(isLoaded && isSignedIn),
    });
    return result.data?.isAdmin;
}

/** Mutation hook; async callable, invalidates all admin queries on success. */
export function useAdminMutation<TResult = unknown, TArgs extends Record<string, unknown> = Record<string, unknown>>(
    name: string,
): (args?: TArgs) => Promise<TResult> {
    const queryClient = useQueryClient();
    const mutation = useMutation<TResult, Error, TArgs | undefined>({
        mutationFn: args => callAdmin<TResult>(name, args ?? {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin'] });
        },
    });
    const { mutateAsync } = mutation;
    return React.useCallback((args?: TArgs) => mutateAsync(args), [mutateAsync]);
}
