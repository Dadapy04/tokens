'use client';

import * as React from 'react';
import { SearchVisibilityProvider } from '../../apps/web/src/components/search-visibility-provider';
import { QueryProvider } from '../../apps/web/src/providers/query-provider';
import type { PreviewEnv, PreviewValue } from './config';
import { installDeterministicPreviewMocks, PreviewNavigationProvider } from './mocks';
import { appendSearchParam } from './search-params';
import '../../packages/ui/src/globals.css';
import '../../apps/web/src/app/globals.css';

installDeterministicPreviewMocks();

interface WrapperProps {
    children: React.ReactNode;
    env?: PreviewEnv | null;
    scenario?: {
        env?: PreviewEnv | null;
    } | null;
    previewArgs?: Record<string, unknown>;
    previewViewport?: {
        id?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
    pathname?: string;
    searchParams?: unknown;
}

function normalizeSearchParams(searchParams: unknown): PreviewEnv['searchParams'] {
    if (searchParams instanceof URLSearchParams) {
        const normalized: Record<string, string | string[]> = {};

        for (const key of searchParams.keys()) {
            const values = searchParams.getAll(key);
            normalized[key] = values.length > 1 ? values : (values[0] ?? '');
        }

        return normalized;
    }

    if (!searchParams || typeof searchParams !== 'object') return {};

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
        appendSearchParam(params, key, value as PreviewValue | undefined);
    }

    const normalized: Record<string, string | string[]> = {};
    for (const key of params.keys()) {
        const values = params.getAll(key);
        normalized[key] = values.length > 1 ? values : (values[0] ?? '');
    }

    return normalized;
}

export default function FormaPreviewWrapper(props: WrapperProps) {
    const env = React.useMemo((): PreviewEnv => {
        if (props.scenario?.env) return props.scenario.env;
        if (props.env) return props.env;

        return {
            pathname: props.pathname ?? '/',
            searchParams: normalizeSearchParams(props.searchParams),
        };
    }, [props.scenario?.env, props.env, props.pathname, props.searchParams]);

    return (
        <PreviewNavigationProvider env={env}>
            <QueryProvider>
                <SearchVisibilityProvider>
                    <div className="min-h-dvh bg-transparent text-text-extra-high">
                        <div className="grid min-h-dvh w-full place-items-center overflow-auto px-6 py-10">
                            <div className="w-full max-w-[410px]">{props.children}</div>
                        </div>
                    </div>
                </SearchVisibilityProvider>
            </QueryProvider>
        </PreviewNavigationProvider>
    );
}
