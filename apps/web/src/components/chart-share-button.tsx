'use client';

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Copy, Download, X } from 'lucide-react';
import { toCanvas } from 'html-to-image';
import { toast } from 'sonner';
import { IconCameraViewfinder } from 'symbols-react';
import { Button } from '@tokens/ui/button';
import { Dialog, DialogClose, DialogContent } from '@tokens/ui/dialog';
import { SegmentedControl } from '@solana/design-system/segmented-control';
import { trackEvent } from '@/lib/posthog-client';
import { ShareCardWithChart, type ShareCardStyleOverrides } from '@/components/share-card-with-chart';
import { ShareCardWithPrice } from '@/components/share-card-with-price';
import { useShareCardDevDials, ShareCardDialRoot } from '@/components/share-card-dev-panel';
import type { LivelinePoint } from 'liveline';

type CardStyle = 'chart' | 'price';

type ShareTimeframe = { value: string; label: string; days: number };

const SHARE_TIMEFRAMES: ShareTimeframe[] = [
    { value: '1', label: '24H', days: 1 },
    { value: '7', label: '7D', days: 7 },
    { value: '30', label: '30D', days: 30 },
];

type ChartShareButtonProps = {
    chartContainerRef: React.RefObject<HTMLElement | null>;
    symbol: string;
    timeframeLabel: string;
    disabled?: boolean;
    onBeforeCapture?: () => void;
    // New props for share cards
    tokenName?: string;
    logoURI?: string;
    currentPrice?: number;
    percentChange?: number;
    pricePoints?: LivelinePoint[];
    chartWindowSecs?: number;
    chartColor?: string;
    /** Current timeframe in days, for the share dialog timeframe selector */
    shareTimeframeDays?: number;
    /** Called when user picks a different timeframe in the share dialog */
    onShareTimeframeChange?: (days: number) => void;
    /** Dev overrides for share card styling */
    shareCardOverrides?: ShareCardStyleOverrides;
};

type ShareState =
    | { status: 'idle' }
    | { status: 'capturing' }
    | { status: 'ready'; blob: Blob; objectUrl: string }
    | { status: 'error'; message: string };

type CachedCapture = { blob: Blob; objectUrl: string; identity: string };

export function ChartShareButton({
    chartContainerRef,
    symbol,
    timeframeLabel,
    disabled,
    onBeforeCapture,
    tokenName,
    logoURI,
    currentPrice,
    percentChange,
    pricePoints,
    chartWindowSecs,
    chartColor,
    shareTimeframeDays,
    onShareTimeframeChange,
    shareCardOverrides,
}: ChartShareButtonProps) {
    const devOverrides = useShareCardDevDials();
    const effectiveOverrides = shareCardOverrides ?? devOverrides;
    const [open, setOpen] = React.useState(false);
    const [cardStyle, setCardStyle] = React.useState<CardStyle>('chart');

    // Use a ref so effects can't clobber state if `open` changes between render and effect flush.
    // Synced in an effect declared before any consumer hooks, so it updates first in every commit.
    const openRef = React.useRef(open);
    React.useEffect(() => {
        openRef.current = open;
    }, [open]);

    const { sharePoints, shareWindow, sharePercentChange, freezeSnapshot, clearSnapshot } = useShareCardSnapshot({
        pricePoints,
        chartWindowSecs,
        percentChange,
        openRef,
    });

    const hasShareCardData = sharePercentChange != null && tokenName != null;
    const hasChartCardData = hasShareCardData && sharePoints != null && sharePoints.length > 0 && shareWindow != null;
    const hasPriceCardData = hasShareCardData && currentPrice != null;
    const displayName = tokenName ?? symbol;
    const overridesKey = React.useMemo(
        () => (effectiveOverrides ? JSON.stringify(effectiveOverrides) : ''),
        [effectiveOverrides],
    );
    const shareCardIdentity = React.useMemo(() => {
        const pctRounded = sharePercentChange != null ? Math.round(sharePercentChange * 10) / 10 : '';
        return [symbol, tokenName ?? '', logoURI ?? '', pctRounded, shareWindow ?? '', overridesKey].join('|');
    }, [symbol, tokenName, logoURI, sharePercentChange, shareWindow, overridesKey]);
    // Fingerprint for re-capture: only changes on timeframe switch (new snapshot) or overrides
    const dataFingerprint = React.useMemo(() => {
        if (!sharePoints || sharePoints.length === 0) return `empty:${shareWindow}:${cardStyle}:${overridesKey}`;
        return `${sharePoints[0]!.time}:${sharePoints.length}:${shareWindow}:${cardStyle}:${overridesKey}`;
    }, [sharePoints, shareWindow, cardStyle, overridesKey]);
    const shareLogoURI = React.useMemo(
        () => getShareImageSrc(logoURI, shareCardIdentity),
        [logoURI, shareCardIdentity],
    );
    const prefersReducedMotion = usePrefersReducedMotion();

    const {
        state,
        setState,
        captureHoldUrl,
        setCaptureHoldUrl,
        incomingVisible,
        setIncomingVisible,
        previewImgRef,
        captureRequestRef,
        latestShareCardIdentityRef,
        blobCacheRef,
        isCaptureRequestCurrent,
        captureCard,
    } = useShareCaptureEngine({
        openRef,
        cardStyle,
        shareCardIdentity,
        dataFingerprint,
        hasChartCardData,
        hasPriceCardData,
        prefersReducedMotion,
        displayName,
        logoURI,
        shareLogoURI,
        sharePercentChange,
        sharePoints,
        shareWindow,
        chartColor,
        currentPrice,
        effectiveOverrides,
    });

    const { beginShare, handleStyleToggle, download, copyAgain } = useShareActions({
        state,
        setState,
        setOpen,
        cardStyle,
        setCardStyle,
        setCaptureHoldUrl,
        setIncomingVisible,
        captureRequestRef,
        latestShareCardIdentityRef,
        blobCacheRef,
        captureCard,
        isCaptureRequestCurrent,
        freezeSnapshot,
        shareCardIdentity,
        hasShareCardData,
        hasChartCardData,
        hasPriceCardData,
        symbol,
        timeframeLabel,
        onBeforeCapture,
        chartContainerRef,
    });

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative size-9 overflow-hidden rounded-full border-transparent bg-black/[0.04] text-text-low hover:bg-black/[0.04] hover:text-text-medium dark:bg-white/[0.08] dark:hover:bg-white/[0.08] [&_svg]:size-4 before:absolute before:inset-[1.5px] before:rounded-full before:bg-white before:opacity-0 before:shadow-[0px_1px_3px_rgba(0,0,0,0.07)] before:transition-opacity before:duration-150 before:content-[''] hover:before:opacity-100 focus-visible:before:opacity-100 dark:before:bg-gray-100"
                onClick={beginShare}
                disabled={disabled}
                aria-label="Share chart"
                data-chart-share-ignore
            >
                <IconCameraViewfinder className="relative z-10 fill-current" aria-hidden="true" />
            </Button>
            <Dialog
                open={open}
                modal={process.env.NODE_ENV !== 'development'}
                onOpenChange={next => {
                    setOpen(next);
                    if (!next) {
                        captureRequestRef.current += 1;
                        setCaptureHoldUrl(null);
                        setIncomingVisible(false);
                        setState({ status: 'idle' });
                        clearSnapshot();
                        const cache = blobCacheRef.current;
                        if (cache.chart) URL.revokeObjectURL(cache.chart.objectUrl);
                        if (cache.price) URL.revokeObjectURL(cache.price.objectUrl);
                        blobCacheRef.current = {};
                    }
                }}
            >
                <DialogContent
                    className="w-[calc(100vw-2rem)] max-w-[420px] rounded-[32px] p-5 gap-4 overflow-hidden font-sans"
                    hideTitle
                    title="Share chart"
                    hideClose
                    onInteractOutside={e => e.preventDefault()}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-title-md text-text-extra-high">Share Card</span>
                        </div>
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="inline-flex size-11 items-center justify-center rounded-full bg-white text-text-medium hover:bg-gray-100 transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </DialogClose>
                    </div>

                    <SharePreviewPane
                        state={state}
                        symbol={symbol}
                        timeframeLabel={timeframeLabel}
                        captureHoldUrl={captureHoldUrl}
                        incomingVisible={incomingVisible}
                        prefersReducedMotion={prefersReducedMotion}
                        previewImgRef={previewImgRef}
                        setIncomingVisible={setIncomingVisible}
                        setCaptureHoldUrl={setCaptureHoldUrl}
                    />

                    {/* Card style + timeframe toggles */}
                    <ShareCardToggles
                        showStyleToggle={hasShareCardData && hasChartCardData && hasPriceCardData}
                        cardStyle={cardStyle}
                        onStyleToggle={handleStyleToggle}
                        shareTimeframeDays={shareTimeframeDays}
                        onShareTimeframeChange={onShareTimeframeChange}
                    />

                    <ShareActionButtons disabled={state.status !== 'ready'} onCopy={copyAgain} onDownload={download} />
                </DialogContent>
            </Dialog>
            {open && process.env.NODE_ENV === 'development' && <ShareCardDialRoot />}
        </>
    );
}

type UseShareCardSnapshotArgs = {
    pricePoints: LivelinePoint[] | undefined;
    chartWindowSecs: number | undefined;
    percentChange: number | undefined;
    openRef: React.RefObject<boolean>;
};

/** Snapshot: frozen at dialog open. Share cards render from this, not live data. */
function useShareCardSnapshot({ pricePoints, chartWindowSecs, percentChange, openRef }: UseShareCardSnapshotArgs) {
    const [snapshotPoints, setSnapshotPoints] = React.useState<LivelinePoint[] | null>(null);
    const [snapshotWindow, setSnapshotWindow] = React.useState<number | null>(null);
    const [snapshotPercent, setSnapshotPercent] = React.useState<number | null>(null);

    // Update snapshot when parent provides new timeframe data (first point time changes)
    const parentFirstTime = pricePoints && pricePoints.length > 0 ? pricePoints[0]!.time : null;
    const snapshotFirstTime = snapshotPoints && snapshotPoints.length > 0 ? snapshotPoints[0]!.time : null;
    React.useEffect(() => {
        if (!openRef.current) return;
        if (parentFirstTime == null) return;
        // Only update snapshot if the data's start time changed (= new timeframe data arrived)
        if (parentFirstTime !== snapshotFirstTime) {
            const frozenPoints = pricePoints ? [...pricePoints] : null;
            setSnapshotPoints(frozenPoints);
            setSnapshotWindow(chartWindowSecs ?? null);
            if (frozenPoints && frozenPoints.length >= 2) {
                const first = frozenPoints[0]!.value;
                const last = frozenPoints.at(-1)!.value;
                setSnapshotPercent(first > 0 ? ((last - first) / first) * 100 : null);
            }
        }
    }, [parentFirstTime, snapshotFirstTime, pricePoints, chartWindowSecs, openRef]);

    // Freeze ALL data as snapshot — the share card is immutable after this point
    const freezeSnapshot = React.useCallback(() => {
        const frozenPoints = pricePoints ? [...pricePoints] : null;
        setSnapshotPoints(frozenPoints);
        setSnapshotWindow(chartWindowSecs ?? null);
        // Derive % from frozen points — matches what the SVG will render
        if (frozenPoints && frozenPoints.length >= 2) {
            const first = frozenPoints[0]!.value;
            const last = frozenPoints.at(-1)!.value;
            setSnapshotPercent(first > 0 ? ((last - first) / first) * 100 : (percentChange ?? null));
        } else {
            setSnapshotPercent(percentChange ?? null);
        }
    }, [pricePoints, chartWindowSecs, percentChange]);

    const clearSnapshot = React.useCallback(() => {
        setSnapshotPoints(null);
        setSnapshotWindow(null);
        setSnapshotPercent(null);
    }, []);

    // Use snapshot data (frozen at dialog open) for share cards, not live data
    const sharePoints = snapshotPoints ?? pricePoints;
    const shareWindow = snapshotWindow ?? chartWindowSecs;
    // Derive % from snapshot points — guaranteed to match the SVG chart line
    const sharePercentChange = snapshotPercent ?? percentChange ?? null;

    return { sharePoints, shareWindow, sharePercentChange, freezeSnapshot, clearSnapshot };
}

type UseShareCaptureEngineArgs = {
    openRef: React.RefObject<boolean>;
    cardStyle: CardStyle;
    shareCardIdentity: string;
    dataFingerprint: string;
    hasChartCardData: boolean;
    hasPriceCardData: boolean;
    prefersReducedMotion: boolean;
    displayName: string;
    logoURI: string | undefined;
    shareLogoURI: string | undefined;
    sharePercentChange: number | null;
    sharePoints: LivelinePoint[] | undefined;
    shareWindow: number | undefined;
    chartColor: string | undefined;
    currentPrice: number | undefined;
    effectiveOverrides: ShareCardStyleOverrides | undefined;
};

/** Owns capture state, blob/object-URL caches, request-current guards, and the capture pipeline. */
function useShareCaptureEngine({
    openRef,
    cardStyle,
    shareCardIdentity,
    dataFingerprint,
    hasChartCardData,
    hasPriceCardData,
    prefersReducedMotion,
    displayName,
    logoURI,
    shareLogoURI,
    sharePercentChange,
    sharePoints,
    shareWindow,
    chartColor,
    currentPrice,
    effectiveOverrides,
}: UseShareCaptureEngineArgs) {
    const [state, setState] = React.useState<ShareState>({ status: 'idle' });
    const [captureHoldUrl, setCaptureHoldUrl] = React.useState<string | null>(null);
    const [incomingVisible, setIncomingVisible] = React.useState(false);

    const previewImgRef = React.useRef<HTMLImageElement>(null);
    const captureRequestRef = React.useRef(0);
    const lastHoldUrlRef = React.useRef<string | null>(null);

    // Cache blobs per card style to avoid re-capture when toggling
    const blobCacheRef = React.useRef<{ chart?: CachedCapture; price?: CachedCapture }>({});

    const latestShareCardIdentityRef = React.useRef(shareCardIdentity);
    const isCaptureRequestCurrent = React.useCallback((requestId: number, identity: string) => {
        return requestId === captureRequestRef.current && identity === latestShareCardIdentityRef.current;
    }, []);

    // Cleanup all cached object URLs on unmount
    React.useEffect(() => {
        return () => {
            const cache = blobCacheRef.current;
            if (cache.chart) URL.revokeObjectURL(cache.chart.objectUrl);
            if (cache.price) URL.revokeObjectURL(cache.price.objectUrl);
            if (lastHoldUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(lastHoldUrlRef.current);
        };
    }, []);

    // Revoke any hold URL after we're done showing it — but only if it's not still
    // referenced by the blob cache (toggling styles reuses cached object URLs).
    React.useEffect(() => {
        const prev = lastHoldUrlRef.current;
        if (prev && prev !== captureHoldUrl && prev.startsWith('blob:')) {
            const cache = blobCacheRef.current;
            const stillCached = cache.chart?.objectUrl === prev || cache.price?.objectUrl === prev;
            if (!stillCached) URL.revokeObjectURL(prev);
        }
        lastHoldUrlRef.current = captureHoldUrl;
    }, [captureHoldUrl]);

    React.useEffect(() => {
        // When live prices are updating, `currentPrice` may change frequently.
        // Don't invalidate/reset capture state while the dialog is open; we capture a snapshot on demand.
        if (openRef.current) return;

        // While closed, capture state is already idle — the dialog close handler and
        // `beginShare` own those resets. Only invalidate in-flight requests and release
        // cached object URLs here.
        const cache = blobCacheRef.current;
        captureRequestRef.current += 1;
        latestShareCardIdentityRef.current = shareCardIdentity;
        if (cache.chart) URL.revokeObjectURL(cache.chart.objectUrl);
        if (cache.price) URL.revokeObjectURL(cache.price.objectUrl);
        blobCacheRef.current = {};
    }, [shareCardIdentity, openRef]);

    // Re-capture when data + overrides change while dialog is open.
    // dataFingerprint only changes when actual new data arrives (not live tick reference changes)
    // or when user changes overrides/cardStyle.
    React.useEffect(() => {
        if (!openRef.current) return;
        if (dataFingerprint.startsWith('empty:')) return; // no data yet

        const effectiveStyle =
            cardStyle === 'chart' && hasChartCardData
                ? 'chart'
                : cardStyle === 'price' && hasPriceCardData
                  ? 'price'
                  : null;
        if (!effectiveStyle) return;

        const timer = setTimeout(() => {
            if (!openRef.current) return;

            const identitySnapshot = shareCardIdentity;
            const requestId = captureRequestRef.current + 1;
            captureRequestRef.current = requestId;
            latestShareCardIdentityRef.current = identitySnapshot;

            setIncomingVisible(false);
            setState({ status: 'capturing' });

            const oldCached = blobCacheRef.current[effectiveStyle];
            if (oldCached) {
                URL.revokeObjectURL(oldCached.objectUrl);
                blobCacheRef.current[effectiveStyle] = undefined;
            }

            (async () => {
                try {
                    await nextPaint();
                    await nextPaint();
                    const result = await captureCard(effectiveStyle, identitySnapshot, requestId);
                    if (!isCaptureRequestCurrent(requestId, identitySnapshot)) return;
                    setState({ status: 'ready', blob: result.blob, objectUrl: result.objectUrl });
                } catch (err) {
                    if (!isCaptureRequestCurrent(requestId, identitySnapshot)) return;
                    if (err instanceof Error && err.message === 'Share capture invalidated.') return;
                    setCaptureHoldUrl(null);
                    setState({
                        status: 'error',
                        message: err instanceof Error ? err.message : 'Failed to generate share image.',
                    });
                }
            })();
        }, 400);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataFingerprint]);

    React.useLayoutEffect(() => {
        if (state.status !== 'ready') return;

        const img = previewImgRef.current;
        if (img && img.complete && img.naturalWidth > 0) {
            setIncomingVisible(true);
            if (prefersReducedMotion) setCaptureHoldUrl(null);
        } else {
            setIncomingVisible(false);
        }
    }, [state, prefersReducedMotion]);

    const captureCard = React.useCallback(
        async (style: CardStyle, identity: string, requestId: number): Promise<{ blob: Blob; objectUrl: string }> => {
            // Check cache first
            const cached = blobCacheRef.current[style];
            if (cached && cached.identity === identity) {
                return { blob: cached.blob, objectUrl: cached.objectUrl };
            }

            try {
                const resolvedLogoURI = await resolveShareLogoURI({
                    rawLogoURI: logoURI,
                    logoURI: shareLogoURI,
                    requestId,
                    identity,
                    isCaptureRequestCurrent,
                });

                const blob = await renderDetachedShareCardPng(
                    style === 'chart' ? (
                        <ShareCardWithChart
                            tokenName={displayName}
                            logoURI={resolvedLogoURI}
                            percentChange={sharePercentChange!}
                            pricePoints={sharePoints!}
                            chartWindowSecs={shareWindow!}
                            chartColor={chartColor}
                            overrides={effectiveOverrides}
                        />
                    ) : (
                        <ShareCardWithPrice
                            tokenName={displayName}
                            logoURI={resolvedLogoURI}
                            percentChange={sharePercentChange!}
                            currentPrice={currentPrice!}
                            overrides={effectiveOverrides}
                        />
                    ),
                );

                const objectUrl = URL.createObjectURL(blob);
                if (!isCaptureRequestCurrent(requestId, identity)) {
                    URL.revokeObjectURL(objectUrl);
                    throw new Error('Share capture invalidated.');
                }

                // Release any stale same-style capture from an older identity before it
                // becomes unreachable. Skip the current hold URL — the hold-URL effect
                // revokes it once it leaves the screen (it won't be cached anymore).
                const stale = blobCacheRef.current[style];
                if (stale && stale.objectUrl !== objectUrl && stale.objectUrl !== lastHoldUrlRef.current) {
                    URL.revokeObjectURL(stale.objectUrl);
                }

                blobCacheRef.current[style] = { blob, objectUrl, identity };
                return { blob, objectUrl };
            } finally {
                // No-op (reserved for per-capture cleanup).
            }
        },
        [
            chartColor,
            shareWindow,
            currentPrice,
            sharePercentChange,
            displayName,
            isCaptureRequestCurrent,
            logoURI,
            sharePoints,
            effectiveOverrides,
            shareLogoURI,
        ],
    );

    return {
        state,
        setState,
        captureHoldUrl,
        setCaptureHoldUrl,
        incomingVisible,
        setIncomingVisible,
        previewImgRef,
        captureRequestRef,
        latestShareCardIdentityRef,
        blobCacheRef,
        isCaptureRequestCurrent,
        captureCard,
    };
}

type UseShareActionsArgs = {
    state: ShareState;
    setState: React.Dispatch<React.SetStateAction<ShareState>>;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    cardStyle: CardStyle;
    setCardStyle: React.Dispatch<React.SetStateAction<CardStyle>>;
    setCaptureHoldUrl: React.Dispatch<React.SetStateAction<string | null>>;
    setIncomingVisible: React.Dispatch<React.SetStateAction<boolean>>;
    captureRequestRef: React.RefObject<number>;
    latestShareCardIdentityRef: React.RefObject<string>;
    blobCacheRef: React.RefObject<{ chart?: CachedCapture; price?: CachedCapture }>;
    captureCard: (style: CardStyle, identity: string, requestId: number) => Promise<{ blob: Blob; objectUrl: string }>;
    isCaptureRequestCurrent: (requestId: number, identity: string) => boolean;
    freezeSnapshot: () => void;
    shareCardIdentity: string;
    hasShareCardData: boolean;
    hasChartCardData: boolean;
    hasPriceCardData: boolean;
    symbol: string;
    timeframeLabel: string;
    onBeforeCapture: (() => void) | undefined;
    chartContainerRef: React.RefObject<HTMLElement | null>;
};

/** Share dialog user actions: open + capture, style toggle re-capture, download, and copy. */
function useShareActions({
    state,
    setState,
    setOpen,
    cardStyle,
    setCardStyle,
    setCaptureHoldUrl,
    setIncomingVisible,
    captureRequestRef,
    latestShareCardIdentityRef,
    blobCacheRef,
    captureCard,
    isCaptureRequestCurrent,
    freezeSnapshot,
    shareCardIdentity,
    hasShareCardData,
    hasChartCardData,
    hasPriceCardData,
    symbol,
    timeframeLabel,
    onBeforeCapture,
    chartContainerRef,
}: UseShareActionsArgs) {
    const beginShare = React.useCallback(async () => {
        const identitySnapshot = shareCardIdentity;
        const requestId = captureRequestRef.current + 1;
        captureRequestRef.current = requestId;
        latestShareCardIdentityRef.current = identitySnapshot;

        trackEvent('chart_share_opened', { token_symbol: symbol, timeframe_label: timeframeLabel });
        // Freeze ALL data as snapshot — the share card is immutable after this point
        freezeSnapshot();
        const holdUrl = state.status === 'ready' ? state.objectUrl : null;
        setOpen(true);
        setCaptureHoldUrl(holdUrl);
        setIncomingVisible(false);
        setState({ status: 'capturing' });

        // Clear previous blob cache
        const oldCache = blobCacheRef.current;
        if (oldCache.chart && oldCache.chart.objectUrl !== holdUrl) URL.revokeObjectURL(oldCache.chart.objectUrl);
        if (oldCache.price && oldCache.price.objectUrl !== holdUrl) URL.revokeObjectURL(oldCache.price.objectUrl);
        blobCacheRef.current = {};

        try {
            onBeforeCapture?.();
            await nextPaint();
            // Extra frames for Liveline canvas to render
            await nextPaint();

            const useShareCards = hasShareCardData;
            let blob: Blob;
            let objectUrl: string;
            let shouldRevokeObjectUrlOnAbort = false;

            if (useShareCards) {
                // Determine which style to use based on data availability
                const effectiveStyle =
                    cardStyle === 'chart' && hasChartCardData
                        ? 'chart'
                        : cardStyle === 'price' && hasPriceCardData
                          ? 'price'
                          : hasChartCardData
                            ? 'chart'
                            : hasPriceCardData
                              ? 'price'
                              : null;

                if (!effectiveStyle) throw new Error('Not enough data for share card.');

                if (effectiveStyle !== cardStyle) setCardStyle(effectiveStyle);
                const result = await captureCard(effectiveStyle, identitySnapshot, requestId);
                blob = result.blob;
                objectUrl = result.objectUrl;
            } else {
                // Fallback: capture live chart (legacy behavior)
                const chartNode = chartContainerRef.current;
                if (!chartNode) throw new Error('Could not find chart to export.');
                const raw = await renderNodePng(chartNode);
                blob = await cropPng(raw, { top: 2, right: 160 });
                objectUrl = URL.createObjectURL(blob);
                shouldRevokeObjectUrlOnAbort = true;
                // Store in cache so it gets cleaned up when dialog closes
                blobCacheRef.current.chart = { blob, objectUrl, identity: identitySnapshot };
            }

            if (!isCaptureRequestCurrent(requestId, identitySnapshot)) {
                if (shouldRevokeObjectUrlOnAbort) URL.revokeObjectURL(objectUrl);
                return;
            }

            const clipboardOk = await tryWritePngToClipboard(blob);
            if (!isCaptureRequestCurrent(requestId, identitySnapshot)) return;

            trackEvent('chart_share_generated', {
                token_symbol: symbol,
                timeframe_label: timeframeLabel,
                clipboard_ok: clipboardOk,
                card_style: hasShareCardData ? cardStyle : 'legacy',
            });

            if (clipboardOk) {
                toast.success('PNG copied to clipboard');
            }

            setState({ status: 'ready', blob, objectUrl });
        } catch (err) {
            if (!isCaptureRequestCurrent(requestId, identitySnapshot)) return;
            if (err instanceof Error && err.message === 'Share capture invalidated.') return;
            const message = err instanceof Error ? err.message : 'Failed to generate share image.';
            trackEvent('chart_share_failed', { token_symbol: symbol, timeframe_label: timeframeLabel, message });
            setCaptureHoldUrl(null);
            setState({ status: 'error', message });
        }
    }, [
        blobCacheRef,
        captureCard,
        captureRequestRef,
        cardStyle,
        chartContainerRef,
        freezeSnapshot,
        hasChartCardData,
        hasPriceCardData,
        hasShareCardData,
        isCaptureRequestCurrent,
        latestShareCardIdentityRef,
        onBeforeCapture,
        setCardStyle,
        setCaptureHoldUrl,
        setIncomingVisible,
        setOpen,
        setState,
        shareCardIdentity,
        state,
        symbol,
        timeframeLabel,
    ]);

    const handleStyleToggle = React.useCallback(
        async (style: CardStyle) => {
            if (style === cardStyle) return;
            const identitySnapshot = latestShareCardIdentityRef.current;
            const requestId = captureRequestRef.current + 1;
            captureRequestRef.current = requestId;

            setCardStyle(style);

            // Preserve existing preview as hold image during re-capture
            if (state.status === 'ready') {
                setCaptureHoldUrl(state.objectUrl);
            }
            setIncomingVisible(false);
            setState({ status: 'capturing' });

            try {
                await nextPaint();
                await nextPaint();
                const result = await captureCard(style, identitySnapshot, requestId);
                if (!isCaptureRequestCurrent(requestId, identitySnapshot)) return;
                await tryWritePngToClipboard(result.blob);
                if (!isCaptureRequestCurrent(requestId, identitySnapshot)) return;
                setState({ status: 'ready', blob: result.blob, objectUrl: result.objectUrl });
            } catch (err) {
                if (!isCaptureRequestCurrent(requestId, identitySnapshot)) return;
                if (err instanceof Error && err.message === 'Share capture invalidated.') return;
                const message = err instanceof Error ? err.message : 'Failed to generate share image.';
                setCaptureHoldUrl(null);
                setState({ status: 'error', message });
            }
        },
        [
            captureCard,
            captureRequestRef,
            cardStyle,
            isCaptureRequestCurrent,
            latestShareCardIdentityRef,
            setCardStyle,
            setCaptureHoldUrl,
            setIncomingVisible,
            setState,
            state,
        ],
    );

    const download = React.useCallback(() => {
        if (state.status !== 'ready') return;
        const a = document.createElement('a');
        a.href = state.objectUrl;
        a.download = `${symbol}-${timeframeLabel}-chart.png`.toLowerCase();
        a.click();
    }, [state, symbol, timeframeLabel]);

    const copyAgain = React.useCallback(async () => {
        if (state.status !== 'ready') return;
        const ok = await tryWritePngToClipboard(state.blob);
        if (ok) {
            toast.success('PNG copied to clipboard');
        } else {
            toast.error('Clipboard copy not supported');
        }
        trackEvent('chart_share_copied_again', {
            token_symbol: symbol,
            timeframe_label: timeframeLabel,
            clipboard_ok: ok,
        });
    }, [state, symbol, timeframeLabel]);

    return { beginShare, handleStyleToggle, download, copyAgain };
}

type SharePreviewPaneProps = {
    state: ShareState;
    symbol: string;
    timeframeLabel: string;
    captureHoldUrl: string | null;
    incomingVisible: boolean;
    prefersReducedMotion: boolean;
    previewImgRef: React.RefObject<HTMLImageElement | null>;
    setIncomingVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setCaptureHoldUrl: React.Dispatch<React.SetStateAction<string | null>>;
};

function SharePreviewPane({
    state,
    symbol,
    timeframeLabel,
    captureHoldUrl,
    incomingVisible,
    prefersReducedMotion,
    previewImgRef,
    setIncomingVisible,
    setCaptureHoldUrl,
}: SharePreviewPaneProps) {
    const showHoldPreview =
        captureHoldUrl != null && (state.status === 'capturing' || (state.status === 'ready' && !incomingVisible));
    const showLoadingFallback =
        (state.status === 'capturing' || (state.status === 'ready' && !incomingVisible)) && !showHoldPreview;

    return (
        <div className="mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl border border-border-medium bg-white shadow-md">
            {state.status === 'error' ? (
                <div className="flex h-full items-center justify-center text-text-medium text-sm bg-white px-6 text-center">
                    {state.message}
                </div>
            ) : state.status === 'idle' ? (
                <div className="flex h-full items-center justify-center text-text-medium text-sm bg-white">
                    Ready when you are.
                </div>
            ) : (
                <div className="relative h-full w-full overflow-hidden bg-white">
                    {showHoldPreview && (
                        <img
                            src={captureHoldUrl}
                            alt=""
                            aria-hidden="true"
                            width={1080}
                            height={1080}
                            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ease-out motion-reduce:transition-none"
                            decoding="async"
                        />
                    )}

                    {state.status === 'ready' && (
                        <img
                            ref={previewImgRef}
                            src={state.objectUrl}
                            alt={`${symbol} ${timeframeLabel} chart`}
                            width={1080}
                            height={1080}
                            className={`absolute inset-0 h-full w-full bg-white object-contain transition-opacity duration-300 ease-out motion-reduce:transition-none motion-reduce:opacity-100 ${
                                incomingVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                            decoding="async"
                            onLoad={() => {
                                setIncomingVisible(true);
                                if (prefersReducedMotion) setCaptureHoldUrl(null);
                            }}
                            onTransitionEnd={() => {
                                if (incomingVisible) {
                                    setCaptureHoldUrl(null);
                                }
                            }}
                        />
                    )}

                    {showLoadingFallback && (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-text-medium bg-white">
                            Generating image…
                        </div>
                    )}

                    {state.status === 'capturing' && showHoldPreview && (
                        <div className="absolute inset-x-0 bottom-4 flex justify-center">
                            <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-text-medium shadow-sm backdrop-blur-sm">
                                Updating…
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

type ShareCardTogglesProps = {
    showStyleToggle: boolean;
    cardStyle: CardStyle;
    onStyleToggle: (style: CardStyle) => void;
    shareTimeframeDays: number | undefined;
    onShareTimeframeChange: ((days: number) => void) | undefined;
};

function ShareCardToggles({
    showStyleToggle,
    cardStyle,
    onStyleToggle,
    shareTimeframeDays,
    onShareTimeframeChange,
}: ShareCardTogglesProps) {
    return (
        <div className="flex items-center justify-center gap-2">
            {showStyleToggle && (
                <SegmentedControl
                    className="w-fit"
                    items={[
                        { value: 'chart', label: 'With Chart' },
                        { value: 'price', label: 'Price Only' },
                    ]}
                    value={cardStyle}
                    onValueChange={value => onStyleToggle(value as CardStyle)}
                    aria-label="Share card style"
                />
            )}
            {onShareTimeframeChange && shareTimeframeDays != null && (
                <SegmentedControl
                    className="w-fit"
                    items={SHARE_TIMEFRAMES.map(tf => ({ value: tf.value, label: tf.label }))}
                    value={String(shareTimeframeDays)}
                    onValueChange={value => {
                        const days = Number(value);
                        if (Number.isFinite(days)) onShareTimeframeChange(days);
                    }}
                    aria-label="Share chart timeframe"
                />
            )}
        </div>
    );
}

type ShareActionButtonsProps = {
    disabled: boolean;
    onCopy: () => void;
    onDownload: () => void;
};

function ShareActionButtons({ disabled, onCopy, onDownload }: ShareActionButtonsProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3">
                <Button
                    type="button"
                    variant="default"
                    size="lg"
                    className="rounded-xl"
                    onClick={onCopy}
                    disabled={disabled}
                >
                    <Copy className="h-4 w-4" />
                    Copy PNG
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl"
                    onClick={onDownload}
                    disabled={disabled}
                >
                    <Download className="h-4 w-4" />
                    Download
                </Button>
            </div>
        </div>
    );
}

async function tryWritePngToClipboard(blob: Blob): Promise<boolean> {
    try {
        if (typeof window === 'undefined') return false;
        if (!('clipboard' in navigator) || typeof navigator.clipboard?.write !== 'function') return false;
        if (typeof window.ClipboardItem !== 'function') return false;
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
        return true;
    } catch {
        return false;
    }
}

async function nextPaint(): Promise<void> {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function resolveShareLogoURI(args: {
    rawLogoURI: string | undefined;
    logoURI: string | undefined;
    requestId: number;
    identity: string;
    isCaptureRequestCurrent: (requestId: number, identity: string) => boolean;
}): Promise<string | undefined> {
    const { rawLogoURI, logoURI, requestId, identity, isCaptureRequestCurrent } = args;
    const primary = (logoURI ?? '').trim();
    const fallback = (rawLogoURI ?? '').trim();
    if (!primary && !fallback) return undefined;
    if (primary.startsWith('data:') || primary.startsWith('blob:')) return primary;

    // Best effort: inline a deterministic `data:` URL so `html-to-image` can't get confused
    // across rapid navigation/captures.
    try {
        // 1) Prefer the share-safe URL (local path or `/api/image-proxy?...`) when available.
        if (primary.startsWith('/')) {
            const dataUrl = await fetchImageAsDataUrl(primary);
            if (dataUrl) {
                if (!isCaptureRequestCurrent(requestId, identity)) throw new Error('Share capture invalidated.');
                return dataUrl;
            }
        }

        // 2) If the proxy is blocked (e.g. host not allowed), try fetching the original URL
        // from the browser directly. This avoids SSRF concerns and works for CDNs with CORS.
        const fallbackRemote =
            fallback.startsWith('http://') || fallback.startsWith('https://')
                ? fallback
                : (extractOriginalSrcFromImageProxy(fallback) ?? extractOriginalSrcFromImageProxy(primary));
        if (fallbackRemote) {
            const dataUrl = await fetchImageAsDataUrl(fallbackRemote);
            if (dataUrl) {
                if (!isCaptureRequestCurrent(requestId, identity)) throw new Error('Share capture invalidated.');
                return dataUrl;
            }
        }

        // 3) Last resort: avoid cross-origin URLs (can break capture). If we couldn't inline it,
        // let the share card fall back to initials.
        return primary.startsWith('/') ? primary : undefined;
    } catch (err) {
        if (err instanceof Error && err.message === 'Share capture invalidated.') throw err;
        return primary.startsWith('/') ? primary : undefined;
    }
}

function extractOriginalSrcFromImageProxy(maybeUrl: string): string | null {
    const trimmed = maybeUrl.trim();
    if (!trimmed) return null;

    try {
        // `maybeUrl` is typically a same-origin path like `/api/image-proxy?src=...`.
        const url =
            trimmed.startsWith('http://') || trimmed.startsWith('https://')
                ? new URL(trimmed)
                : new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'https://example.invalid');

        if (url.pathname !== '/api/image-proxy') return null;
        const src = (url.searchParams.get('src') ?? '').trim();
        if (!src) return null;
        if (!src.startsWith('http://') && !src.startsWith('https://')) return null;
        return src;
    } catch {
        return null;
    }
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'omit',
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) return null;
        const dataUrl = await blobToDataUrl(blob);
        return dataUrl ? dataUrl : null;
    } catch {
        return null;
    }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Failed to read logo blob.'));
        reader.readAsDataURL(blob);
    });
}

async function renderDetachedShareCardPng(card: React.ReactElement): Promise<Blob> {
    const mountNode = document.createElement('div');
    mountNode.setAttribute('aria-hidden', 'true');
    Object.assign(mountNode.style, {
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        pointerEvents: 'none',
        opacity: '1',
        zIndex: '-1',
    });
    document.body.appendChild(mountNode);

    const root = createRoot(mountNode);

    try {
        root.render(card);
        await nextPaint();
        await nextPaint();

        const cardNode = mountNode.firstElementChild;
        if (!(cardNode instanceof HTMLElement)) {
            throw new Error('Share card not found.');
        }

        await waitForRenderableImages(cardNode);
        await nextPaint();
        return await renderShareCardPng(cardNode);
    } finally {
        root.unmount();
        mountNode.remove();
    }
}

async function waitForRenderableImages(node: HTMLElement): Promise<void> {
    const images = Array.from(node.querySelectorAll('img'));
    if (images.length === 0) return;

    await Promise.all(
        images.map(async img => {
            if (img.complete && img.naturalWidth > 0) {
                if (typeof img.decode === 'function') {
                    await img.decode().catch(() => undefined);
                }
                return;
            }

            await new Promise<void>(resolve => {
                const done = () => {
                    img.removeEventListener('load', done);
                    img.removeEventListener('error', done);
                    resolve();
                };

                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
            });

            if (img.complete && img.naturalWidth > 0 && typeof img.decode === 'function') {
                await img.decode().catch(() => undefined);
            }
        }),
    );
}

/** Render a share card node (1080x1080) to a PNG blob at 2x resolution. */
async function renderShareCardPng(node: HTMLElement): Promise<Blob> {
    const canvas = await toCanvas(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1080,
        height: 1080,
    });

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => {
            if (!b) reject(new Error('Failed to export PNG.'));
            else resolve(b);
        }, 'image/png');
    });
}

/** Legacy: render any DOM node to PNG (used as fallback when share card data is unavailable). */
async function renderNodePng(node: HTMLElement): Promise<Blob> {
    const rect = node.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));

    const EXPORT_PAD_LEFT_PX = 28;
    const EXPORT_PAD_RIGHT_PX = 0;
    const exportWidth = width + EXPORT_PAD_LEFT_PX + EXPORT_PAD_RIGHT_PX;

    const canvas = await toCanvas(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: exportWidth,
        height,
        filter: el => {
            const closest = (el as unknown as { closest?: unknown }).closest;
            if (typeof closest !== 'function') return true;
            return !(closest as (selector: string) => Element | null).call(el, '[data-chart-share-ignore]');
        },
        style: {
            width: `${exportWidth}px`,
            height: `${height}px`,
            boxSizing: 'border-box',
            paddingLeft: `${EXPORT_PAD_LEFT_PX}px`,
            paddingRight: `${EXPORT_PAD_RIGHT_PX}px`,
            overflow: 'visible',
        },
    });

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => {
            if (!b) reject(new Error('Failed to export PNG.'));
            else resolve(b);
        }, 'image/png');
    });
}

async function cropPng(blob: Blob, crop: { top: number; right?: number }): Promise<Blob> {
    try {
        const top = Math.max(0, Math.floor(crop.top));
        const right = Math.max(0, Math.floor(crop.right ?? 0));
        if (top === 0 && right === 0) return blob;
        if (typeof createImageBitmap !== 'function') return blob;

        const bitmap = await createImageBitmap(blob).catch(() => null);
        if (!bitmap) return blob;

        const width = bitmap.width;
        const height = bitmap.height;
        const outWidth = width - right;
        const outHeight = height - top;
        if (outWidth <= 0 || outHeight <= 0) {
            bitmap.close?.();
            return blob;
        }

        const canvas = document.createElement('canvas');
        canvas.width = outWidth;
        canvas.height = outHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap.close?.();
            return blob;
        }

        ctx.drawImage(bitmap, 0, top, outWidth, outHeight, 0, 0, outWidth, outHeight);
        bitmap.close?.();

        const out = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        return out ?? blob;
    } catch {
        return blob;
    }
}

function getShareImageSrc(src: string | undefined, cacheKey: string): string | undefined {
    if (!src) return undefined;
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;

    const cacheBust = encodeURIComponent(cacheKey);
    if (src.startsWith('/')) {
        const separator = src.includes('?') ? '&' : '?';
        return `${src}${separator}shareFresh=1&v=${cacheBust}`;
    }

    try {
        const url = new URL(src);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return `/api/image-proxy?fresh=1&v=${cacheBust}&src=${encodeURIComponent(src)}`;
        }
    } catch {
        return src;
    }

    return src;
}

function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setPrefersReducedMotion(mediaQuery.matches);

        update();
        mediaQuery.addEventListener('change', update);
        return () => mediaQuery.removeEventListener('change', update);
    }, []);

    return prefersReducedMotion;
}
