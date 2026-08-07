import { Badge } from '@solana/design-system/badge';
import { Select, SelectItem } from '@solana/design-system/select';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { SELECT_ITEM_CLASS_NAME } from './api-playground-constants';
import type { ApiPlaygroundEndpointConfig } from './api-playground-types';
import { getMethodBadgeClassName } from './api-playground-utils';

interface ApiKeyReadyBadgeProps {
    canExecuteLive: boolean;
    usesProjectKeyProxy: boolean;
}

function ApiKeyReadyBadge({ canExecuteLive, usesProjectKeyProxy }: ApiKeyReadyBadgeProps) {
    return (
        <Badge variant={canExecuteLive ? 'success' : 'danger'} dot className="font-mono">
            {canExecuteLive
                ? usesProjectKeyProxy
                    ? 'Active project key ready'
                    : 'API key ready (hidden)'
                : 'API key unavailable'}
        </Badge>
    );
}

interface EndpointSelectorProps {
    endpoints: ApiPlaygroundEndpointConfig[];
    activeEndpoint: ApiPlaygroundEndpointConfig;
    onEndpointChange: (endpointId: string) => void;
}

function EndpointSelector({ endpoints, activeEndpoint, onEndpointChange }: EndpointSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => setIsOpen(false), [activeEndpoint.id]);

    return (
        <div className="group relative h-10">
            <span
                className={cn(
                    'pointer-events-none absolute inset-0 rounded-[11px]',
                    'border-[length:var(--input-border-width)]',
                    'border-[var(--input-border-idle)]',
                    'bg-[var(--input-bg-idle)]',
                    'transition-[border-color,background-color] duration-150 ease-out',
                    'motion-reduce:transition-none',
                    !isOpen && 'group-hover:border-[var(--input-border-hover)] group-hover:bg-[var(--input-bg-hover)]',
                    isOpen && 'border-[var(--input-border-focus)]',
                )}
            />
            <span
                className={cn(
                    'pointer-events-none absolute inset-0 rounded-[11px]',
                    'shadow-[0_0_0_2px_var(--input-focus-ring)]',
                    'transition-opacity duration-150 ease-out',
                    'motion-reduce:transition-none',
                    isOpen
                        ? 'opacity-100 duration-0'
                        : 'opacity-0 group-focus-within:opacity-100 group-focus-within:duration-0',
                )}
            />

            <div className="pointer-events-none relative flex h-10 w-full items-center px-3">
                <span className="flex min-w-0 items-center gap-3 pr-8">
                    <span
                        className={cn(
                            'inline-flex rounded-[6px] px-2 py-1 text-[10px] font-bold tracking-[0.06em]',
                            getMethodBadgeClassName(activeEndpoint.method),
                        )}
                    >
                        {activeEndpoint.method}
                    </span>
                    <span className="truncate text-[15px] font-medium text-[#1c1c1d] dark:text-white">
                        {activeEndpoint.title}
                    </span>
                </span>
            </div>

            <Select
                size="lg"
                value={activeEndpoint.id}
                onValueChange={value => {
                    if (!value) return;
                    onEndpointChange(value);
                }}
                onOpenChange={setIsOpen}
                placeholder="Select endpoint"
                className="!absolute !left-0 !top-0 !h-10 !w-full !opacity-0 z-10"
            >
                {endpoints.map(endpoint => (
                    <SelectItem
                        key={endpoint.id}
                        value={endpoint.id}
                        description={`${endpoint.method} ${endpoint.path}`}
                        className={SELECT_ITEM_CLASS_NAME}
                    >
                        {endpoint.title}
                    </SelectItem>
                ))}
            </Select>

            <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className={cn(
                    'pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2',
                    'text-[rgba(28,28,29,0.42)] dark:text-white/50',
                    'transition-[transform,opacity] duration-150 ease-out',
                    'motion-reduce:transition-none',
                    isOpen ? 'rotate-180 opacity-70' : 'opacity-44 group-hover:opacity-56',
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="m4 6 4 4 4-4" />
            </svg>
        </div>
    );
}

export interface HeaderBarProps {
    endpoints: ApiPlaygroundEndpointConfig[];
    activeEndpoint: ApiPlaygroundEndpointConfig;
    canExecuteLive: boolean;
    usesProjectKeyProxy: boolean;
    onEndpointChange: (endpointId: string) => void;
}

export function HeaderBar({
    endpoints,
    activeEndpoint,
    canExecuteLive,
    usesProjectKeyProxy,
    onEndpointChange,
}: HeaderBarProps) {
    return (
        <div className="grid shrink-0 border-b border-[rgba(28,28,29,0.1)] lg:grid-cols-2">
            <div className="px-6 py-5">
                <EndpointSelector
                    endpoints={endpoints}
                    activeEndpoint={activeEndpoint}
                    onEndpointChange={onEndpointChange}
                />
            </div>

            <div className="border-t border-[rgba(28,28,29,0.1)] px-6 py-5 lg:border-t-0">
                <div className="flex justify-stretch lg:justify-end">
                    <ApiKeyReadyBadge canExecuteLive={canExecuteLive} usesProjectKeyProxy={usesProjectKeyProxy} />
                </div>
            </div>
        </div>
    );
}
