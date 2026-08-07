'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

import { useDashboardQuery } from '@/hooks/use-dashboard-api';
import type { ProjectApiKeyRow } from '@/lib/dashboard-types';

type ProjectApiKeys = ProjectApiKeyRow[];

function buildPlaceholderKey(keyPreview: string): string {
    const prefix = keyPreview.replace('…', '').trim();
    if (!prefix) return '';
    return `${prefix}${'x'.repeat(8)}...`;
}

function isRawApiKey(value: string): boolean {
    return /^tok_[0-9a-f]{64}$/i.test(value.trim());
}

export type DisplayedApiKey =
    | { kind: 'fresh'; apiKeyId: string; rawKey: string }
    | { kind: 'preview'; apiKeyId: string; keyPreview: string };

export interface ProjectApiKeysContextValue {
    projectId: string | null;
    apiKeys: ProjectApiKeys | undefined;
    apiKeysCount: number | null;
    hasActiveApiKey: boolean;
    activeApiKeyCanReveal: boolean;
    /** Raw key while fresh (just created/regenerated), masked placeholder otherwise. */
    currentApiKey: string;
    currentApiKeyId: string | null;
    currentApiKeyIsFresh: boolean;
    /** Call with the raw key after a reset/create so it stays visible until refetch/invalidation catches up. */
    onApiKeyReset: (rawKey: string, apiKeyId: string) => void;
}

const ProjectApiKeysContext = createContext<ProjectApiKeysContextValue | null>(null);

export function ProjectApiKeysProvider({
    projectId,
    children,
}: {
    projectId: string | null;
    children: React.ReactNode;
}) {
    const { isLoaded, isSignedIn } = useAuth();
    const isAuthenticated = Boolean(isLoaded && isSignedIn);

    const [displayedApiKey, setDisplayedApiKey] = useState<DisplayedApiKey | null>(null);

    const { data: apiKeys } = useDashboardQuery<ProjectApiKeys>(
        'usersGetAllProjectApiKeys',
        isAuthenticated && projectId ? { projectId } : 'skip',
    );
    const apiKeysCount = isAuthenticated && projectId ? (apiKeys === undefined ? null : apiKeys.length) : null;
    const activeApiKey = apiKeys?.find(key => key.isActive) ?? null;
    const hasActiveApiKey = Boolean(activeApiKey);
    const activeApiKeyCanReveal = Boolean(activeApiKey?.canReveal);

    useEffect(() => {
        setDisplayedApiKey(null);
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;
        if (!apiKeys || apiKeys.length === 0) return;
        const active = apiKeys.find(k => k.isActive) ?? apiKeys[0];
        if (!active) return;

        const activePrefix = active.keyPreview.replace('…', '').trim();
        setDisplayedApiKey(previous => {
            // Keep a freshly revealed raw key visible until the subscription
            // catches up — this is the only time the raw secret is shown.
            if (
                previous?.kind === 'fresh' &&
                previous.apiKeyId === active._id &&
                isRawApiKey(previous.rawKey) &&
                previous.rawKey.startsWith(activePrefix)
            ) {
                return previous;
            }

            return { kind: 'preview', apiKeyId: active._id, keyPreview: active.keyPreview };
        });
    }, [apiKeys, projectId]);

    const onApiKeyReset = useCallback((rawKey: string, apiKeyId: string) => {
        setDisplayedApiKey({ kind: 'fresh', apiKeyId, rawKey });
    }, []);

    const currentApiKey = displayedApiKey
        ? displayedApiKey.kind === 'fresh'
            ? displayedApiKey.rawKey
            : buildPlaceholderKey(displayedApiKey.keyPreview)
        : '';
    const currentApiKeyId = displayedApiKey?.apiKeyId ?? activeApiKey?._id ?? null;
    const currentApiKeyIsFresh = displayedApiKey?.kind === 'fresh';

    const value = useMemo<ProjectApiKeysContextValue>(
        () => ({
            projectId,
            apiKeys,
            apiKeysCount,
            hasActiveApiKey,
            activeApiKeyCanReveal,
            currentApiKey,
            currentApiKeyId,
            currentApiKeyIsFresh,
            onApiKeyReset,
        }),
        [
            projectId,
            apiKeys,
            apiKeysCount,
            hasActiveApiKey,
            activeApiKeyCanReveal,
            currentApiKey,
            currentApiKeyId,
            currentApiKeyIsFresh,
            onApiKeyReset,
        ],
    );

    return <ProjectApiKeysContext.Provider value={value}>{children}</ProjectApiKeysContext.Provider>;
}

export function useProjectApiKeys(): ProjectApiKeysContextValue {
    const ctx = useContext(ProjectApiKeysContext);
    if (!ctx) throw new Error('useProjectApiKeys must be used within ProjectApiKeysProvider');
    return ctx;
}
