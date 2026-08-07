'use client';

import { useCallback, useMemo, useState } from 'react';

import { CopyButton } from '@/components/app-ui/copy-button';

interface CopyMarkdownButtonProps {
    slugPath: string;
}

function buildMarkdownUrl(slugPath: string): string {
    const params = new URLSearchParams();
    if (slugPath.trim()) params.set('slug', slugPath.trim());
    return `/api/page-markdown?${params.toString()}`;
}

export function CopyMarkdownButton(props: CopyMarkdownButtonProps) {
    const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');

    const url = useMemo(() => buildMarkdownUrl(props.slugPath), [props.slugPath]);

    const onCopy = useCallback(async (): Promise<void> => {
        if (state === 'loading') return;
        setState('loading');

        try {
            const res = await fetch(url, { method: 'GET' });
            if (!res.ok) throw new Error(`Failed to load markdown (${res.status})`);
            const text = await res.text();
            await navigator.clipboard.writeText(text);
            setState('copied');
            window.setTimeout(() => setState('idle'), 1500);
        } catch {
            setState('error');
            window.setTimeout(() => setState('idle'), 2000);
        }
    }, [state, url]);

    return (
        <div className="flex items-center gap-2">
            <CopyButton
                onCopy={onCopy}
                displayText={state === 'copied' ? 'Copied' : state === 'loading' ? 'Copying…' : 'Copy Markdown'}
                ariaLabel="Copy page as Markdown"
                disabled={state === 'loading'}
            />
            {state === 'error' ? <span className="text-xs text-muted-foreground">Copy failed</span> : null}
        </div>
    );
}
