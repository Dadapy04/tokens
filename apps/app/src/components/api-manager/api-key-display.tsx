'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { callDashboard, useDashboardMutation } from '@/hooks/use-dashboard-api';
import type { ApiKeyResetResult, ApiKeyRevealResult } from '@/lib/dashboard-types';
import { FolderTab } from '@/components/app-ui/folder-tab';
import { Button } from '@tokens/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@tokens/ui/tooltip';
import { IconExclamationmarkTriangleFill, IconAsterisk, IconEye, IconEyeSlash } from 'symbols-react';
import { TextShimmer } from '@/components/app-ui/text-shimmer';
import { Spinner } from '@tokens/ui/spinner';
import { motion, AnimatePresence } from 'motion/react';
import { PassedIcon } from '@/public/assets/PassedIcon';
import { toast } from 'sonner';
import { Copy, CopyCheck } from 'lucide-react';
import { normalizeApiKeyReveal } from './api-key-reveal';

interface ApiKeyDisplayProps {
    fullApiKey?: string | null;
    apiKeyId: string | null;
    isFreshApiKey: boolean;
    hasApiKey: boolean;
    canRevealApiKey: boolean;
    projectId: string;
    onApiKeyReset: (newApiKey: string, newApiKeyId: string) => void;
}

const AUTO_HIDE_AFTER_MS = 20_000;

export function ApiKeyDisplay({
    fullApiKey,
    apiKeyId,
    isFreshApiKey,
    hasApiKey,
    canRevealApiKey,
    projectId,
    onApiKeyReset,
}: ApiKeyDisplayProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [countdown, setCountdown] = useState(AUTO_HIDE_AFTER_MS / 1000);
    const [didCopyFreshKey, setDidCopyFreshKey] = useState(false);

    const resetApiKey = useDashboardMutation<ApiKeyResetResult>('apiKeysReset');
    const revealApiKey = useCallback(
        (args: { projectId: string; apiKeyId: string }) => callDashboard<ApiKeyRevealResult>('apiKeysReveal', args),
        [],
    );
    const safeFullApiKey = fullApiKey ?? '';

    useEffect(() => {
        if (!isFreshApiKey) {
            setIsRevealed(false);
            setCountdown(AUTO_HIDE_AFTER_MS / 1000);
            setDidCopyFreshKey(false);
            return;
        }

        setIsRevealed(true);
        setCountdown(AUTO_HIDE_AFTER_MS / 1000);
        setDidCopyFreshKey(false);
    }, [safeFullApiKey, isFreshApiKey]);

    useEffect(() => {
        if (!isRevealed || !isFreshApiKey || !hasApiKey) {
            setCountdown(AUTO_HIDE_AFTER_MS / 1000);
            return;
        }

        const deadline = Date.now() + AUTO_HIDE_AFTER_MS;
        const interval = setInterval(() => {
            const remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setCountdown(remainingSeconds);
            if (remainingSeconds === 0) {
                setIsRevealed(false);
                clearInterval(interval);
            }
        }, 250);

        return () => clearInterval(interval);
    }, [hasApiKey, isFreshApiKey, isRevealed]);

    const handleRegenerate = useCallback(async () => {
        setIsRegenerating(true);
        try {
            const result = await resetApiKey({ projectId });
            const reveal = normalizeApiKeyReveal(result);
            if (!reveal) {
                throw new Error('API key reset did not return a reveal value');
            }
            onApiKeyReset(reveal.rawKey, reveal.apiKeyId);
            toast.success('API key regenerated', {
                description: 'Your previous key is now inactive.',
            });
        } catch (error) {
            console.error('Failed to regenerate API key:', error);
            toast.error('Failed to regenerate API key');
        } finally {
            setIsRegenerating(false);
        }
    }, [resetApiKey, projectId, onApiKeyReset]);

    const revealStoredKey = useCallback(async (): Promise<string | null> => {
        if (!apiKeyId || !canRevealApiKey) {
            toast.error("Can't reveal API key", {
                description: 'This legacy key cannot be revealed. Regenerate once to enable reveal/copy.',
            });
            return null;
        }

        const result = await revealApiKey({ projectId, apiKeyId });
        if (result.status !== 'ok') {
            toast.error("Can't reveal API key", {
                description: 'This legacy key cannot be revealed. Regenerate once to enable reveal/copy.',
            });
            return null;
        }

        onApiKeyReset(result.rawKey, result.apiKeyId);
        return result.rawKey;
    }, [apiKeyId, canRevealApiKey, onApiKeyReset, projectId, revealApiKey]);

    const handleToggleReveal = useCallback(async () => {
        if (!hasApiKey) return;
        if (!isFreshApiKey) {
            const rawKey = await revealStoredKey();
            if (rawKey) setIsRevealed(true);
            return;
        }
        setIsRevealed(prev => !prev);
    }, [hasApiKey, isFreshApiKey, revealStoredKey]);

    const handleCopy = useCallback(async () => {
        let keyToCopy = isFreshApiKey ? safeFullApiKey : '';
        if (!keyToCopy && canRevealApiKey) {
            keyToCopy = (await revealStoredKey()) ?? '';
        }

        if (!keyToCopy) {
            toast.error("Can't copy API key", {
                description: 'This legacy key cannot be revealed. Regenerate once to enable reveal/copy.',
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(keyToCopy);
            setDidCopyFreshKey(true);
            toast.success('API key copied');
        } catch (error) {
            console.error('Failed to copy API key:', error);
            toast.error('Failed to copy API key');
        }
    }, [canRevealApiKey, isFreshApiKey, revealStoredKey, safeFullApiKey]);

    const isPlaceholderKey = !isFreshApiKey;

    // Create the masked display with circles matching the full key length
    const maskedDisplay = useMemo(() => {
        if (!safeFullApiKey) return '';

        return (
            <div className="flex items-center gap-0.5">
                {Array.from({ length: safeFullApiKey.length }).map((_, index) => (
                    <IconAsterisk key={index} className="h-[5.5px] w-[5.5px] fill-current" />
                ))}
            </div>
        );
    }, [safeFullApiKey]);

    // Determine which status to show
    const getStatusKey = () => {
        if (!hasApiKey || isRegenerating) return null;
        if (isRevealed && isFreshApiKey) return 'revealed';
        return 'hidden';
    };

    const statusKey = getStatusKey();

    const statusMotion = {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.22, ease: 'easeOut' },
    } as const;

    return (
        <div className="relative">
            <FolderTab
                iconName="API Key"
                hasApiKey={hasApiKey}
                isRegenerating={isRegenerating}
                onRegenerate={handleRegenerate}
                regenerateTooltip={isRegenerating ? 'Regenerating...' : 'Regenerate API key'}
            />
            <div className="relative overflow-hidden bg-gradient-to-b from-zinc-700 dark:from-zinc-900/60 to-zinc-700 dark:to-zinc-900/90 shadow-xl shadow-zinc-900/20 dark:shadow-black/20 rounded-xl rounded-tl-none border border-zinc-800/50">
                {/* Circle SVG pattern background */}
                <div
                    className="absolute inset-0 z-0 size-full opacity-40 dark:opacity-30"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='rgba(255,250,250,0.2)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat',
                    }}
                />

                {/* Keep the gradient fade effect */}
                <div
                    className={`absolute bottom-0 left-0 h-[100%] w-screen bg-gradient-to-t from-zinc-900 via-zinc-900 to-zinc-900 dark:from-zinc-950/0 dark:via-zinc-950 dark:to-zinc-950`}
                />
                <div className="px-4 py-4 z-50 relative">
                    <h3 className="text-md leading-6 font-semibold text-white">Your API Key</h3>
                    <div className="max-w-xl text-xs text-muted-foreground">
                        <p>
                            {isFreshApiKey
                                ? 'Copy now. This full key is only shown for the current session.'
                                : 'Use this key in your application to authenticate requests to the Tokens API.'}
                        </p>
                    </div>
                    <div className="mt-5">
                        <div className="relative">
                            {hasApiKey && (
                                <div className="absolute inset-y-0 right-0 pr-2 flex items-center z-50">
                                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 rounded-r-lg bg-gradient-to-l from-zinc-800/80 via-zinc-800/40 to-transparent dark:from-zinc-950/50 dark:via-zinc-950/30" />

                                    <div className="relative flex items-center gap-1">
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleCopy}
                                                    disabled={(!isFreshApiKey && !canRevealApiKey) || isRegenerating}
                                                    aria-label="Copy API key"
                                                    className="relative h-8 w-8 rounded-sm text-white hover:bg-white/10 transition-colors duration-150 disabled:text-white/30"
                                                >
                                                    {didCopyFreshKey ? (
                                                        <CopyCheck className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className="bg-zinc-800 dark:bg-zinc-900 rounded-sm py-1 px-2"
                                            >
                                                <p className="text-xs text-white">
                                                    {isFreshApiKey || canRevealApiKey
                                                        ? 'Copy full key'
                                                        : 'Regenerate to copy full key'}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleToggleReveal}
                                                    disabled={!hasApiKey || isRegenerating || (!isFreshApiKey && !canRevealApiKey)}
                                                    aria-label={isRevealed ? 'Hide API key' : 'Show API key'}
                                                    className="relative h-8 w-8 rounded-sm text-white hover:bg-white/10 transition-colors duration-150 disabled:text-white/30"
                                                >
                                                    {isRevealed ? (
                                                        <IconEyeSlash className="h-3.5 w-3.5 fill-current" />
                                                    ) : (
                                                        <IconEye className="h-3.5 w-3.5 fill-current" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className="bg-zinc-800 dark:bg-zinc-900 rounded-sm py-1 px-2"
                                            >
                                                <p className="text-xs text-white">
                                                    {isFreshApiKey || canRevealApiKey
                                                        ? isRevealed
                                                            ? 'Hide key'
                                                            : 'Show key'
                                                        : 'Regenerate to reveal full key'}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            )}
                            {isRevealed ? (
                                <div className="flex-1 font-mono border border-zinc-700 bg-zinc-700/50 backdrop-blur-sm pl-2.5 pr-12 py-2 rounded-lg min-h-[40px] flex items-center">
                                            {isPlaceholderKey ? (
                                                <span className="text-yellow-400 text-xs">
                                            {canRevealApiKey
                                                ? 'Decrypting API key...'
                                                : 'This legacy key cannot be revealed. Regenerate once to enable reveal/copy.'}
                                        </span>
                                    ) : (
                                        <TextShimmer className="text-white/50 text-xs" duration={1.5}>
                                            {safeFullApiKey}
                                        </TextShimmer>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 font-mono border border-zinc-700 bg-zinc-700/50 backdrop-blur-sm pl-2.5 pr-12 py-2 rounded-lg text-white min-h-[40px] flex items-center">
                                    {isRegenerating ? (
                                        <div className="flex items-center gap-2">
                                            <Spinner size="sm" className="text-blue-400" />
                                            <TextShimmer className="text-xs text-blue-200 font-mono" duration={1.8}>
                                                Regenerating API key...
                                            </TextShimmer>
                                        </div>
                                    ) : hasApiKey ? (
                                        maskedDisplay
                                    ) : (
                                        <div className="flex items-center gap-2 text-white/70">
                                            <IconExclamationmarkTriangleFill className="h-4 w-4 fill-yellow-300" />
                                            <span className="text-xs font-mono">No API key yet</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Animated Status */}
                        <div className="mt-4.5 relative h-5">
                            <AnimatePresence mode="wait">
                                {statusKey === 'hidden' && (
                                    <motion.div
                                        key="hidden"
                                        {...statusMotion}
                                        className="flex w-full items-center justify-between gap-2 text-xs text-green-400 absolute"
                                    >
                                        <div className="flex items-center gap-2">
                                            <PassedIcon className="size-4 fill-emerald-400 shadow-sm shadow-emerald-300/40 rounded-full" />
                                            <span className="text-white text-xs font-mono">API key ready</span>
                                        </div>

                                        <span className="text-white/50 text-xs font-mono font-normal">
                                            {isFreshApiKey ? '(hidden after first view)' : '(regenerate to reveal)'}
                                        </span>
                                    </motion.div>
                                )}

                                {statusKey === 'revealed' && (
                                    <motion.div
                                        key="revealed"
                                        {...statusMotion}
                                        className="flex w-full items-center justify-between gap-2 text-xs text-green-400 absolute"
                                    >
                                        <div className="flex items-center gap-2">
                                            <IconExclamationmarkTriangleFill className="w-3 h-3 fill-amber-300" />
                                            <span className="text-white text-xs font-mono">Full key revealed</span>
                                        </div>
                                        <span
                                            className={`text-xs font-mono font-normal transition-colors duration-300 motion-reduce:transition-none ${
                                                countdown <= 5
                                                    ? 'text-red-400 animate-pulse motion-reduce:animate-none'
                                                    : 'text-white/50'
                                            }`}
                                        >
                                            (hiding in {countdown}s)
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
