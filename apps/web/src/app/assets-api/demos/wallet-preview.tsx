'use client';

import { useMemo, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { motion } from 'motion/react';

import { usePrimaryVariantColors } from './use-primary-variant-colors';
import { walletAssetFromData, type VariantHolding, type WalletAsset } from './wallet-demo-data';

const STACK_EASE = [0.32, 0.72, 0, 1] as const;
const STACK_TRANSITION = { duration: 0.24, ease: STACK_EASE };
const PRESS_TRANSITION = { duration: 0.14, ease: STACK_EASE };
const COLLAPSED_Y = [22, 46, 64, 82] as const;
const COLLAPSED_FADE = [0.82, 0.48, 0.22, 0] as const;
const COLLAPSED_CONTENT_OPACITY = [0.56, 0.18, 0.06, 0] as const;
const EXPANDED_ROW_GAP = 84;
const EXPANDED_FIRST_ROW_Y = 126;
const BREAKDOWN_FRAME_Y = 104;

interface StackRow {
    kind: 'canonical' | 'variant';
    key: string;
    transform: string;
    fade: number;
    contentOpacity: number;
    variantIndex?: number;
    insetClassName?: string;
    holding?: VariantHolding;
}

export function WalletPreview({ data }: { data: unknown }) {
    const asset = useMemo(() => walletAssetFromData(data), [data]);
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="relative flex min-h-[660px] items-center justify-center overflow-hidden p-5">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                }}
            />
            <div className="relative w-full max-w-[520px]">
                <StackedTokenRows asset={asset} expanded={expanded} onToggleExpanded={() => setExpanded((value) => !value)} />
            </div>
        </div>
    );
}

function StackedTokenRows({
    asset,
    expanded,
    onToggleExpanded,
}: {
    asset: WalletAsset;
    expanded: boolean;
    onToggleExpanded: () => void;
}) {
    const sampledColors = usePrimaryVariantColors(asset.variantHoldings);
    const rows = useMemo(() => buildStackRows(asset.variantHoldings, expanded), [asset.variantHoldings, expanded]);
    const [pressedRowKey, setPressedRowKey] = useState<string | null>(null);
    const [hoveredVariantIndex, setHoveredVariantIndex] = useState<number | null>(null);

    return (
        <div className="relative px-5 py-6">
            <div className="relative h-[500px]">
                <BasketBreakdownFrame expanded={expanded} itemCount={asset.variantHoldings.length} />
                {rows.map((row) => {
                    const rowOpacity =
                        row.kind === 'variant' && hoveredVariantIndex !== null && hoveredVariantIndex !== row.variantIndex
                            ? 0.28
                            : 1;

                    return (
                        <RowTransformShell key={row.key} row={row} isPressed={pressedRowKey === row.key}>
                            <motion.div
                                className="relative flex h-[80px] items-center overflow-hidden rounded-[26px] px-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] ring-[2px] ring-inset ring-black/40 backdrop-blur-xl"
                                initial={false}
                                animate={{
                                    opacity: rowOpacity,
                                    backgroundColor: `rgba(255,255,255,${0.06 * row.fade})`,
                                    borderColor: `rgba(255,255,255,${0.06 * row.fade})`,
                                }}
                                transition={STACK_TRANSITION}
                                style={{ borderWidth: 1, borderStyle: 'solid' }}
                            >
                                {row.kind === 'canonical' ? (
                                    <CanonicalCardOverlay />
                                ) : null}
                                {row.kind === 'canonical' ? (
                                    <TokenImageWash src={asset.imageUrl} variant="canonical" />
                                ) : (
                                    <TokenImageWash src={row.holding!.logoUrl} variant="variant" />
                                )}
                                <div className={`relative z-10 w-full ${row.kind === 'canonical' ? 'mt-1.5' : ''}`}>
                                    {row.kind === 'canonical' ? (
                                        <CanonicalTokenRow
                                            asset={asset}
                                            expanded={expanded}
                                            colors={sampledColors}
                                            hoveredVariantIndex={hoveredVariantIndex}
                                            onToggleExpanded={onToggleExpanded}
                                            onPressChange={(pressed) => setPressedRowKey(pressed ? row.key : null)}
                                            onHoverVariantChange={setHoveredVariantIndex}
                                        />
                                    ) : (
                                        <VariantHoldingRow holding={row.holding!} contentOpacity={row.contentOpacity} />
                                    )}
                                </div>
                            </motion.div>
                        </RowTransformShell>
                    );
                })}
            </div>
        </div>
    );
}

function BasketBreakdownFrame({ expanded, itemCount }: { expanded: boolean; itemCount: number }) {
    return (
        <motion.div
            className="absolute inset-x-0 rounded-[30px] px-3 pt-2 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl"
            initial={false}
            animate={{
                opacity: expanded ? 1 : 0,
                transform: expanded
                    ? `translateY(${BREAKDOWN_FRAME_Y}px) scale(1) translateZ(0)`
                    : `translateY(${BREAKDOWN_FRAME_Y + 14}px) scale(0.98) translateZ(0)`,
                height: expanded ? 122 + Math.max(0, itemCount - 1) * EXPANDED_ROW_GAP : 80,
            }}
            transition={STACK_TRANSITION}
            style={{
                pointerEvents: 'none',
                transformOrigin: 'top center',
            }}
        >
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
                <rect
                    x="0.5"
                    y="0.5"
                    width="calc(100% - 1px)"
                    height="calc(100% - 1px)"
                    rx="30"
                    fill="none"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="1"
                    strokeDasharray="14 10"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-[#121213] px-3 py-1 font-berkeley-mono text-[11px] uppercase leading-none tracking-[0.16em] text-white/44">
                Basket Breakdown
            </div>
        </motion.div>
    );
}

function TokenImageWash({ src, variant }: { src: string; variant: 'canonical' | 'variant' }) {
    if (!src) return null;

    return (
        <img
            src={src}
            alt=""
            aria-hidden
            className={`pointer-events-none absolute left-[-18px] top-1/2 z-[1] -translate-y-1/2 rounded-full object-cover blur-2xl ${
                variant === 'canonical' ? 'size-[108px] opacity-22' : 'size-[88px] opacity-18'
            }`}
        />
    );
}

function CanonicalCardOverlay() {
    return (
        <>
            <div
                className="pointer-events-none absolute inset-0 z-0 size-full opacity-30 dark:opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='rgba(255,250,250,0.2)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-full w-full bg-gradient-to-t from-zinc-950/0 via-zinc-900/55 to-zinc-900/68 dark:from-primary-950/0 dark:via-primary-950/72 dark:to-primary-950/82" />
        </>
    );
}

function RowTransformShell({
    row,
    isPressed,
    children,
}: {
    row: StackRow;
    isPressed: boolean;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            className={`absolute will-change-transform ${row.insetClassName ?? 'inset-x-0'}`}
            initial={false}
            animate={{ transform: row.transform }}
            transition={STACK_TRANSITION}
            style={{ transformOrigin: 'top center' }}
        >
            <motion.div
                className="h-full"
                initial={false}
                animate={{ transform: isPressed ? 'scale(0.98) translateZ(0)' : 'scale(1) translateZ(0)' }}
                transition={PRESS_TRANSITION}
                style={{ transformOrigin: 'center' }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

function buildStackRows(holdings: ReadonlyArray<VariantHolding>, expanded: boolean): StackRow[] {
    const variantRows = holdings
        .map((holding, index) => {
            const y = expanded ? EXPANDED_FIRST_ROW_Y + index * EXPANDED_ROW_GAP : (COLLAPSED_Y[index] ?? 82);
            const scale = expanded ? 1 : 1 - 0.035 * (index + 1);
            return {
                kind: 'variant' as const,
                key: holding.id,
                transform: `translateY(${y}px) scale(${scale}) translateZ(0)`,
                fade: expanded ? 0.78 : (COLLAPSED_FADE[index] ?? 0),
                contentOpacity: expanded ? 1 : (COLLAPSED_CONTENT_OPACITY[index] ?? 0),
                variantIndex: index,
                insetClassName: expanded ? 'left-4 right-4' : 'inset-x-0',
                holding,
            };
        })
        .reverse();

    return [
        ...variantRows,
        {
            kind: 'canonical',
            key: 'canonical',
            transform: 'translateY(0px) scale(1) translateZ(0)',
            fade: 1,
            contentOpacity: 1,
            insetClassName: 'inset-x-0',
        },
    ];
}

function CanonicalTokenRow({
    asset,
    expanded,
    colors,
    hoveredVariantIndex,
    onToggleExpanded,
    onPressChange,
    onHoverVariantChange,
}: {
    asset: WalletAsset;
    expanded: boolean;
    colors: string[];
    hoveredVariantIndex: number | null;
    onToggleExpanded: () => void;
    onPressChange: (pressed: boolean) => void;
    onHoverVariantChange: (index: number | null) => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggleExpanded}
            onPointerDown={() => onPressChange(true)}
            onPointerCancel={() => onPressChange(false)}
            onPointerLeave={() => onPressChange(false)}
            onPointerUp={() => onPressChange(false)}
            onBlur={() => onPressChange(false)}
            className="h-full w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-expanded={expanded}
        >
            <div className="flex translate-y-[-1px] items-center gap-4">
                <AssetIcon src={asset.imageUrl} symbol={asset.symbolLabel} />
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[16px] font-medium leading-6 text-white">
                        {asset.nameLabel}
                    </div>
                    <div className="mt-1.5 w-1/2">
                        <HoldingsBar
                            segments={asset.compositionSegments.map((segment, index) => ({
                                ...segment,
                                color: colors[index] ?? segment.color,
                            }))}
                            hoveredIndex={hoveredVariantIndex}
                            onHoverSegment={onHoverVariantChange}
                        />
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <div className="text-[15px] font-medium text-white">
                        {asset.balanceLabel}
                    </div>
                    <div className="mt-0.5 text-[13px] font-medium text-white/52">
                        {asset.accountLabel}
                    </div>
                </div>
                <Ellipsis className="size-5 shrink-0 rotate-90 text-white/44" strokeWidth={2.5} aria-hidden />
            </div>
        </button>
    );
}

function VariantHoldingRow({
    holding,
    contentOpacity,
}: {
    holding: VariantHolding;
    contentOpacity: number;
}) {
    return (
        <motion.div
            className="flex h-full items-center justify-between gap-4"
            initial={false}
            animate={{ opacity: contentOpacity }}
            transition={{ duration: 0.18, ease: STACK_EASE }}
        >
            <div className="flex min-w-0 items-center gap-4">
                <VariantIcon src={holding.logoUrl} />
                <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium leading-5 text-white/92">
                        {holding.name}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] font-medium text-white/44">
                        {holding.symbol}
                    </div>
                </div>
            </div>
            <div className="shrink-0 text-right">
                <div className="text-[13px] font-medium text-white/86">
                    {holding.balanceLabel}
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-white/44">
                    {holding.accountLabel}
                </div>
            </div>
        </motion.div>
    );
}

function AssetIcon({ src, symbol }: { src: string; symbol: string }) {
    if (src) {
        return (
            <img
                src={src}
                alt=""
                className="size-[46px] shrink-0 rounded-[15px] border-2 border-black/90 bg-white object-cover"
            />
        );
    }

    return (
        <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[15px] bg-white/[0.06] text-[22px] font-semibold text-white/70">
            {symbol.slice(0, 1) || '$'}
        </div>
    );
}

function HoldingsBar({
    segments,
    hoveredIndex,
    onHoverSegment,
}: {
    segments: ReadonlyArray<{ weight: number; color: string }>;
    hoveredIndex: number | null;
    onHoverSegment: (index: number | null) => void;
}) {
    const normalized = normalizeSegments(segments);
    return (
        <div className="flex h-[8px] w-full max-w-[180px] gap-1.5" onPointerLeave={() => onHoverSegment(null)}>
            {normalized.map((segment, index) => (
                <div
                    key={index}
                    className="h-full min-w-2 rounded-full border-[0.5px] border-white/20 ring ring-black/80 backdrop-blur-xl"
                    onPointerEnter={() => onHoverSegment(index)}
                    style={{
                        flexGrow: segment.weight,
                        backgroundColor: segment.color,
                        opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.3,
                        transition: 'opacity 160ms cubic-bezier(0.23, 1, 0.32, 1)',
                    }}
                />
            ))}
        </div>
    );
}

function normalizeSegments(segments: ReadonlyArray<{ weight: number; color: string }>) {
    const cleaned = segments
        .map((segment) => ({
            weight: Number.isFinite(segment.weight) ? Math.max(0, segment.weight) : 0,
            color: segment.color,
        }))
        .filter((segment) => segment.weight > 0);
    const sum = cleaned.reduce((acc, segment) => acc + segment.weight, 0);
    if (sum <= 0) return [];
    return cleaned.map((segment) => ({ ...segment, weight: segment.weight / sum }));
}

function VariantIcon({ src }: { src: string }) {
    return (
        <div className="flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black/80 bg-white/[0.06] backdrop-blur-xl">
            <img src={src} alt="" className="h-full w-full object-cover" />
        </div>
    );
}
