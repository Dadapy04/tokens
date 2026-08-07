'use client';

import { useCallback } from 'react';
import { useProjectApiKeys } from '@/contexts/project-api-keys';
import { callDashboard, useDashboardMutation } from '@/hooks/use-dashboard-api';
import type { ApiKeyRevealResult } from '@/lib/dashboard-types';
import { Button } from '@tokens/ui/button';
import { Badge } from '@tokens/ui/badge';
import { CopyButton } from '@/components/app-ui/copy-button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { isRawApiKey } from './api-playground-utils';
import { EmptyState } from '@/components/global/empty-state';
import { Skeleton } from '@tokens/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/app-ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';

import { IconTrashFill, IconCircleFill, IconKeySlashFill, IconExclamationmarkTriangleFill } from 'symbols-react';

interface ApiListProps {
    projectId: string;
}

// Skeleton Components
const ApiListSectionSkeleton = ({
    title,
    description,
    rowCount = 1,
}: {
    title: string;
    description: string;
    rowCount?: number;
}) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div>
                <h4 className="font-medium">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>

        <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
            {/* Header */}
            <div className="px-3 py-2">
                <div className="grid grid-cols-4 gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <div className="text-left flex items-center gap-1">Key Preview</div>
                    <div className="text-left flex items-center gap-1">Status</div>
                    <div className="text-left flex items-center gap-1">Created</div>
                    <div className="text-right flex items-center justify-end gap-1">
                        {title === 'Active Keys' ? <>Actions</> : <>Deactivated</>}
                    </div>
                </div>
            </div>

            {/* Skeleton Rows */}
            <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg shadow-sm overflow-hidden">
                {Array.from({ length: rowCount }).map((_, index) => (
                    <ApiListRowSkeleton key={index} isLast={index === rowCount - 1} />
                ))}
            </div>
        </div>
    </div>
);

const ApiListRowSkeleton = ({ isLast }: { isLast: boolean }) => (
    <div className={`grid grid-cols-4 gap-4 px-4 py-3 ${!isLast ? 'border-b' : ''}`}>
        {/* Key Preview */}
        <div className="flex items-center">
            <Skeleton className="h-4 w-32 rounded" />
        </div>

        {/* Status Badge */}
        <div className="flex items-center">
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Created Date */}
        <div className="flex items-center">
            <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Actions/Deactivated */}
        <div className="flex items-center justify-end">
            <Skeleton className="h-8 w-8 rounded" />
        </div>
    </div>
);

const ApiListLoadingSkeleton = () => (
    <div className="space-y-8">
        {/* Active Keys Section Skeleton - 1 row */}
        <ApiListSectionSkeleton title="Active Keys" description="Currently active and usable API keys" rowCount={1} />

        {/* Inactive Keys Section Skeleton - 3 rows */}
        <ApiListSectionSkeleton
            title="Inactive Keys"
            description="Deactivated API keys that are no longer usable"
            rowCount={3}
        />
    </div>
);

// Single section skeleton for regeneration states
const SingleSectionSkeleton = ({ title, description }: { title: string; description: string }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div>
                <h4 className="font-medium">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>

        <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
            {/* Header */}
            <div className="px-3 py-2">
                <div className="grid grid-cols-4 gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <div className="text-left flex items-center gap-1">Key Preview</div>
                    <div className="text-left flex items-center gap-1">Status</div>
                    <div className="text-left flex items-center gap-1">Created</div>
                    <div className="text-right flex items-center justify-end gap-1">
                        {title === 'Active Keys' ? <>Actions</> : <>Deactivated</>}
                    </div>
                </div>
            </div>

            {/* Single Skeleton Row */}
            <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg shadow-sm overflow-hidden">
                <ApiListRowSkeleton isLast={true} />
            </div>
        </div>
    </div>
);

export function ApiList({ projectId }: ApiListProps) {
    const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const { apiKeys, currentApiKey } = useProjectApiKeys();
    const trimmedFullApiKey = currentApiKey.trim();
    const canCopyFullApiKey = isRawApiKey(trimmedFullApiKey);

    const deleteApiKey = useDashboardMutation<null, { apiKeyId: string }>('apiKeysRevoke');
    const revealApiKey = useCallback(
        (args: { projectId: string; apiKeyId: string }) => callDashboard<ApiKeyRevealResult>('apiKeysReveal', args),
        [],
    );

    // Separate active and inactive keys
    const { activeKeys, inactiveKeys } = useMemo(() => {
        if (!apiKeys) return { activeKeys: [], inactiveKeys: [] };

        return {
            activeKeys: apiKeys.filter(key => key.isActive),
            inactiveKeys: apiKeys.filter(key => !key.isActive),
        };
    }, [apiKeys]);

    // Track when we're transitioning (had keys, now don't, but not initial load)
    useEffect(() => {
        if (apiKeys !== undefined) {
            if (deletingKeyId && activeKeys.length === 0) {
                setIsTransitioning(true);
                // Show skeleton for a brief moment during regeneration
                const timer = setTimeout(() => {
                    setIsTransitioning(false);
                }, 1500); // 1.5 seconds for regeneration skeleton

                return () => clearTimeout(timer);
            } else {
                setIsTransitioning(false);
            }
        }
    }, [apiKeys, deletingKeyId, activeKeys.length]);

    const handleDeleteKey = async (apiKeyId: string) => {
        setDeletingKeyId(apiKeyId);
        try {
            await deleteApiKey({ apiKeyId });
        } catch (error) {
            console.error('Failed to delete API key:', error);
        } finally {
            setDeletingKeyId(null);
        }
    };

    const handleCopyUnavailable = () => {
        toast.error("Can't copy API key", {
            description: 'This legacy key cannot be revealed. Regenerate once to enable reveal/copy.',
            icon: <IconExclamationmarkTriangleFill className="mt-0.5 h-4 w-4 fill-amber-400" />,
        });
    };

    const handleCopyRevealableKey = async (apiKeyId: string) => {
        try {
            const result = await revealApiKey({ projectId, apiKeyId });
            if (result.status !== 'ok') {
                handleCopyUnavailable();
                return;
            }
            await navigator.clipboard.writeText(result.rawKey);
            toast.success('API key copied');
        } catch (error) {
            console.error('Failed to copy API key:', error);
            toast.error('Failed to copy API key');
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    };

    const KeyList = ({ keys, title, description }: { keys: typeof apiKeys; title: string; description: string }) => (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div>
                    <h4 className="font-medium">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>

            {keys && keys.length > 0 ? (
                <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
                    {/* Header */}
                    <div className="px-3 py-2">
                        <div className="grid grid-cols-4 gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            <div className="text-left flex items-center gap-1">Key Preview</div>
                            <div className="text-left flex items-center gap-1">Status</div>
                            <div className="text-left flex items-center gap-1">Created</div>
                            <div className="text-right flex items-center justify-end gap-1">
                                {title === 'Active Keys' ? <>Actions</> : <>Deactivated</>}
                            </div>
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg shadow-sm overflow-hidden">
                        {keys.map(apiKey => {
                            const createdDateTime = formatDate(apiKey.createdAt);
                            const deactivatedDateTime = apiKey.deactivatedAt ? formatDate(apiKey.deactivatedAt) : null;

                            return (
                                <div
                                    key={apiKey._id}
                                    className="grid grid-cols-4 gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="font-mono text-sm flex items-center">{apiKey.keyPreview}</div>
                                    <div className="flex items-center">
                                        <Badge
                                            variant={apiKey.isActive ? 'success' : 'destructive'}
                                            className="flex items-center gap-1.5 px-1.5"
                                        >
                                            <IconCircleFill
                                                className={`w-1.5 h-1.5 ${
                                                    apiKey.isActive
                                                        ? 'fill-emerald-500 rounded-xs'
                                                        : 'fill-red-500 rounded-full'
                                                }`}
                                            />
                                            {apiKey.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="text-sm flex flex-col justify-center">
                                        <div>{createdDateTime.date}</div>
                                        <div className="text-xs text-muted-foreground">{createdDateTime.time}</div>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        {apiKey.isActive ? (
                                            <div className="flex items-center justify-end gap-1">
                                                {canCopyFullApiKey ? (
                                                    <CopyButton
                                                        textToCopy={trimmedFullApiKey}
                                                        showText={false}
                                                        ariaLabel="Copy API key"
                                                        onCopied={() => toast.success('API key copied')}
                                                        className="h-8 w-8 rounded-sm hover:bg-gray-50/60 hover:opacity-100 transition-colors duration-150"
                                                        iconClassName="h-4 w-4 text-muted-foreground group-hover:text-foreground dark:group-hover:text-foreground"
                                                        iconClassNameCheck="h-4 w-4"
                                                    />
                                                ) : apiKey.canReveal ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyRevealableKey(apiKey._id)}
                                                        aria-label="Copy API key"
                                                        className="h-8 w-8 p-0 hover:bg-gray-50/60 transition-colors duration-150"
                                                    >
                                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleCopyUnavailable}
                                                        aria-label="Copy API key (regenerate required)"
                                                        className="h-8 w-8 p-0 opacity-50 hover:bg-gray-50/60 hover:opacity-60 transition-colors duration-150"
                                                    >
                                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                )}

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={deletingKeyId === apiKey._id}
                                                            aria-label="Deactivate API key"
                                                            className="h-8 w-8 p-0 bg-transparent group-hover:bg-rose-500/10 transition-colors"
                                                        >
                                                            <IconTrashFill className="w-4 h-4 fill-muted-foreground group-hover:fill-rose-500 transition-colors" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Deactivate API Key</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to deactivate this API key?
                                                                <br />
                                                                <br />
                                                                <span className="font-mono text-sm bg-muted/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-black/[0.15]">
                                                                    {apiKey.keyPreview}
                                                                </span>
                                                                <br />
                                                                <br />
                                                                <span className="text-destructive font-medium">
                                                                    This action cannot be undone. Any applications using
                                                                    this key will stop working immediately.
                                                                </span>
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteKey(apiKey._id)}
                                                                className="bg-destructive text-white hover:bg-destructive/90"
                                                            >
                                                                {deletingKeyId === apiKey._id
                                                                    ? 'Deactivating...'
                                                                    : 'Deactivate Key'}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        ) : (
                                            // Show deactivation date for inactive keys
                                            <div className="text-sm text-muted-foreground flex flex-col items-end">
                                                {deactivatedDateTime ? (
                                                    <>
                                                        <div>{deactivatedDateTime.date}</div>
                                                        <div className="text-xs">{deactivatedDateTime.time}</div>
                                                    </>
                                                ) : (
                                                    'Unknown'
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<IconKeySlashFill className="size-[60px] mb-2 fill-muted-foreground" />}
                    title={`No ${title.toLowerCase()}`}
                    subtitle={
                        title === 'Active Keys'
                            ? 'Create your first API key to get started'
                            : 'Your deactivated API keys will be shown here'
                    }
                    className="py-6 border border-dashed border-border rounded-lg"
                />
            )}
        </div>
    );

    // Show skeleton loading state for initial load
    if (!apiKeys) {
        return <ApiListLoadingSkeleton />;
    }

    // Show skeleton during key regeneration/transition
    if (isTransitioning) {
        return (
            <div className="space-y-8">
                <SingleSectionSkeleton title="Active Keys" description="Currently active and usable API keys" />
                {inactiveKeys.length > 0 && (
                    <KeyList
                        keys={inactiveKeys}
                        title="Inactive Keys"
                        description="Deactivated API keys that are no longer usable"
                    />
                )}
            </div>
        );
    }

    // Show empty state only if truly no keys at all
    if (apiKeys.length === 0) {
        return (
            <div className="space-y-6">
                <EmptyState
                    icon={<IconKeySlashFill className="size-[60px] mb-2 fill-muted-foreground" />}
                    title="No API keys found"
                    subtitle="Create your first API key to get started with the API"
                />
            </div>
        );
    }

    // Normal state - check if we need skeleton for active keys when there are no active keys
    const shouldShowActiveKeysSkeleton = activeKeys.length === 0 && inactiveKeys.length > 0;

    return (
        <div className="space-y-8">
            {/* Active Keys Section */}
            {shouldShowActiveKeysSkeleton ? (
                <SingleSectionSkeleton title="Active Keys" description="Currently active and usable API keys" />
            ) : (
                <KeyList keys={activeKeys} title="Active Keys" description="Currently active and usable API keys" />
            )}

            {/* Inactive Keys Section */}
            <KeyList
                keys={inactiveKeys}
                title="Inactive Keys"
                description="Deactivated API keys that are no longer usable"
            />
        </div>
    );
}
