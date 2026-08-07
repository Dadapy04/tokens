'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAdminMutation } from '@/hooks/use-admin-api';
import type {
    AddCheckedVariantResult,
    CheckedVariantPreview,
    StockVariantTier,
    TrustTier,
} from '@/lib/admin-types';
import { Alert, AlertDescription, AlertTitle } from '@tokens/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@tokens/ui/avatar';
import { Button } from '@tokens/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@tokens/ui/dialog';
import { Input } from '@tokens/ui/input';
import { Label } from '@tokens/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tokens/ui/select';
import { Separator } from '@tokens/ui/separator';
import { Spinner } from '@tokens/ui/spinner';
import { Badge } from '@solana/design-system/badge';

type StockVariantTierControlValue = StockVariantTier | 'none';

type CanonicalVariantDefaults = {
    assetId: string;
    category: string;
    name?: string;
    symbol?: string;
    imageUrl?: string;
    collections?: string[];
};

const MINT_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TRUST_TIERS: TrustTier[] = ['tier1', 'tier2', 'tier3', 'experimental'];
const STOCK_VARIANT_TIERS: StockVariantTier[] = ['share_redeemable', 'cash_redeemable', 'not_redeemable'];

interface AddVariantDialogProps {
    canonical: CanonicalVariantDefaults | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddVariantDialog({ canonical, open, onOpenChange }: AddVariantDialogProps): React.JSX.Element {
    const checkVariantMintForCanonical = useAdminMutation<CheckedVariantPreview>('adminCheckVariantMintForCanonical');
    const addCheckedVariant = useAdminMutation<AddCheckedVariantResult>('adminAddCheckedVariant');

    const [mint, setMint] = useState('');
    const [checkedPreview, setCheckedPreview] = useState<CheckedVariantPreview | null>(null);
    const [checkError, setCheckError] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [label, setLabel] = useState('');
    const [trustTier, setTrustTier] = useState<TrustTier>('tier3');
    const [stockVariantTier, setStockVariantTier] = useState<StockVariantTierControlValue>('none');
    const [tags, setTags] = useState('');

    const trimmedMint = mint.trim();
    const hasMint = trimmedMint.length > 0;
    const isValidMint = MINT_REGEX.test(trimmedMint);
    const canCheck = !!canonical && isValidMint && !isChecking && !isSubmitting;
    const canSubmit = !!checkedPreview && !checkedPreview.conflict && !isChecking && !isSubmitting;

    const mintError = useMemo(() => {
        if (!hasMint) return null;
        if (!isValidMint) return 'Not a valid Solana mint address.';
        return null;
    }, [hasMint, isValidMint]);

    function resetCheckedState() {
        setCheckedPreview(null);
        setCheckError(null);
        setLabel('');
        setTrustTier('tier3');
        setStockVariantTier('none');
        setTags('');
    }

    function onMintChange(value: string) {
        setMint(value);
        resetCheckedState();
    }

    function onCheckAnotherMint() {
        setMint('');
        resetCheckedState();
    }

    async function onCheckMint() {
        if (!canonical || !canCheck) return;
        setIsChecking(true);
        setCheckError(null);
        try {
            const result = await checkVariantMintForCanonical({
                assetId: canonical.assetId,
                mint: trimmedMint,
            });
            setCheckedPreview(result);
            setLabel(result.variantWrite.label ?? result.marketWrite.symbol);
            setTrustTier(result.variantWrite.trustTier);
            setStockVariantTier(
                result.variantWrite.stockVariantTier ??
                    (canonical.category === 'equity' || result.variantWrite.kind === 'tokenized_equity'
                        ? 'not_redeemable'
                        : 'none'),
            );
            setTags(result.variantWrite.tags.join(', '));
        } catch (error) {
            setCheckedPreview(null);
            setCheckError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsChecking(false);
        }
    }

    async function onSubmit() {
        if (!checkedPreview || checkedPreview.conflict) return;
        setIsSubmitting(true);
        const toastId = toast.loading('Adding variant…');
        try {
            const result = await addCheckedVariant({
                checkedPreview,
                overrides: {
                    label: label.trim() || null,
                    trustTier,
                    stockVariantTier:
                        canonical?.category === 'equity' || checkedPreview.variantWrite.kind === 'tokenized_equity'
                            ? stockVariantTier === 'none'
                                ? null
                                : stockVariantTier
                            : null,
                    tags: tags
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(Boolean),
                },
            });
            toast.success(
                `Added ${result.mint} to ${result.assetId}. Scheduled ${result.scheduled.join(', ')}.`,
                { id: toastId },
            );
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : String(error), { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    function onDialogOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            setMint('');
            resetCheckedState();
            setIsChecking(false);
            setIsSubmitting(false);
        }
        onOpenChange(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={onDialogOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Variant</DialogTitle>
                    <DialogDescription>Check a mint, review Birdeye data, then add it to this canonical.</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {canonical ? <CanonicalContextHeader canonical={canonical} /> : null}

                    <MintCheckForm
                        mint={mint}
                        mintError={mintError}
                        isChecking={isChecking}
                        isSubmitting={isSubmitting}
                        canCheck={canCheck}
                        hasCheckedPreview={!!checkedPreview || !!checkError}
                        onMintChange={onMintChange}
                        onCheckMint={onCheckMint}
                        onCheckAnotherMint={onCheckAnotherMint}
                    />

                    {isChecking ? (
                        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                            <Spinner className="h-4 w-4" />
                            Checking mint with Birdeye…
                        </div>
                    ) : null}

                    {checkError ? (
                        <Alert variant="destructive">
                            <AlertTitle>Unable to check mint</AlertTitle>
                            <AlertDescription>{checkError}</AlertDescription>
                        </Alert>
                    ) : null}

                    {checkedPreview ? (
                        <div className="space-y-4">
                            <ConflictNotice conflict={checkedPreview.conflict} />
                            <CheckedTokenSummary preview={checkedPreview} />
                            <MarketSummary preview={checkedPreview} />
                            <MinimalOverrides
                                label={label}
                                trustTier={trustTier}
                                stockVariantTier={stockVariantTier}
                                showStockVariantTier={
                                    canonical?.category === 'equity' ||
                                    checkedPreview.variantWrite.kind === 'tokenized_equity'
                                }
                                tags={tags}
                                disabled={isSubmitting}
                                onLabelChange={setLabel}
                                onTrustTierChange={setTrustTier}
                                onStockVariantTierChange={setStockVariantTier}
                                onTagsChange={setTags}
                            />
                            <DbWriteSummary
                                preview={checkedPreview}
                                label={label}
                                trustTier={trustTier}
                                stockVariantTier={stockVariantTier}
                                tags={tags}
                            />
                        </div>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onDialogOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    {checkedPreview || checkError ? (
                        <Button variant="outline" onClick={onCheckAnotherMint} disabled={isSubmitting || isChecking}>
                            Check another mint
                        </Button>
                    ) : null}
                    <Button onClick={onSubmit} disabled={!canSubmit}>
                        {isSubmitting ? 'Adding…' : 'Add variant'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CanonicalContextHeader({ canonical }: { canonical: CanonicalVariantDefaults }) {
    const collections = canonical.collections ?? [];
    return (
        <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                    {canonical.imageUrl ? <AvatarImage src={canonical.imageUrl} alt={canonical.symbol ?? canonical.assetId} /> : null}
                    <AvatarFallback className="text-[10px]">
                        {(canonical.symbol ?? canonical.assetId).slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="font-inter-semibold">{canonical.symbol ?? canonical.assetId}</div>
                    <div className="truncate text-sm text-muted-foreground">{canonical.name ?? canonical.assetId}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="default">{canonical.category}</Badge>
                        <Badge variant="info">{canonical.assetId}</Badge>
                        {collections.length > 0 ? (
                            collections.map(collection => (
                                <Badge key={collection} variant="info">
                                    {collection}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant="warning">No website lists</Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MintCheckForm({
    mint,
    mintError,
    isChecking,
    isSubmitting,
    canCheck,
    hasCheckedPreview,
    onMintChange,
    onCheckMint,
}: {
    mint: string;
    mintError: string | null;
    isChecking: boolean;
    isSubmitting: boolean;
    canCheck: boolean;
    hasCheckedPreview: boolean;
    onMintChange: (value: string) => void;
    onCheckMint: () => void;
    onCheckAnotherMint: () => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor="variant-mint">Mint</Label>
            <div className="flex gap-2">
                <Input
                    id="variant-mint"
                    value={mint}
                    onChange={event => onMintChange(event.target.value)}
                    placeholder="Paste Solana mint"
                    disabled={isChecking || isSubmitting || hasCheckedPreview}
                    autoFocus
                />
                <Button onClick={onCheckMint} disabled={!canCheck} className="shrink-0">
                    {isChecking ? (
                        <span className="inline-flex items-center gap-2">
                            <Spinner className="h-4 w-4" />
                            Checking
                        </span>
                    ) : (
                        'Check mint'
                    )}
                </Button>
            </div>
            {mintError ? <p className="text-xs text-destructive">{mintError}</p> : null}
        </div>
    );
}

function ConflictNotice({ conflict }: { conflict: CheckedVariantPreview['conflict'] }) {
    if (!conflict) return null;
    if (conflict.type === 'same_canonical') {
        return (
            <Alert>
                <AlertTitle>Already attached</AlertTitle>
                <AlertDescription>
                    This mint is already attached to this canonical as {conflict.variantId}.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert variant="destructive">
            <AlertTitle>Mint belongs to another canonical</AlertTitle>
            <AlertDescription>
                Current canonical: {conflict.assetId}. Current variant: {conflict.variantId}. Use Move variant to reassign it.
            </AlertDescription>
        </Alert>
    );
}

function CheckedTokenSummary({ preview }: { preview: CheckedVariantPreview }) {
    return (
        <div className="rounded-md border border-border bg-white p-3">
            <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                    {preview.marketWrite.logoURI ? (
                        <AvatarImage src={preview.marketWrite.logoURI} alt={preview.marketWrite.symbol} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">{preview.marketWrite.symbol.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="font-inter-semibold">{preview.marketWrite.symbol}</div>
                        <Badge variant="success">Birdeye</Badge>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{preview.marketWrite.name}</div>
                    <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-[1fr_auto]">
                        <div className="truncate">
                            <span className="font-inter-medium text-foreground">Mint:</span> {preview.mint}
                        </div>
                        <CopyButton value={preview.mint} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-inter-medium text-foreground">Decimals:</span> {preview.marketWrite.decimals}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CopyButton({ value }: { value: string }) {
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => void navigator.clipboard.writeText(value)}
        >
            Copy
        </Button>
    );
}

function MarketSummary({ preview }: { preview: CheckedVariantPreview }) {
    const fields = [
        ['Price', formatValue(preview.marketWrite.price)],
        ['Liquidity', formatValue(preview.marketWrite.liquidity)],
        ['Volume 24h', formatValue(preview.marketWrite.volume24hUSD)],
        ['Market cap', formatValue(preview.marketWrite.marketCap)],
        ['FDV', formatValue(preview.marketWrite.fdv)],
        ['Holders', formatValue(preview.marketWrite.holder)],
    ] as const;

    return (
        <div>
            <div className="mb-2 text-sm font-inter-semibold">Market summary</div>
            <div className="grid gap-2 sm:grid-cols-3">
                {fields.map(([label, value]) => (
                    <SummaryField key={label} label={label} value={value} />
                ))}
            </div>
        </div>
    );
}

function MinimalOverrides({
    label,
    trustTier,
    stockVariantTier,
    showStockVariantTier,
    tags,
    disabled,
    onLabelChange,
    onTrustTierChange,
    onStockVariantTierChange,
    onTagsChange,
}: {
    label: string;
    trustTier: TrustTier;
    stockVariantTier: StockVariantTierControlValue;
    showStockVariantTier: boolean;
    tags: string;
    disabled: boolean;
    onLabelChange: (value: string) => void;
    onTrustTierChange: (value: TrustTier) => void;
    onStockVariantTierChange: (value: StockVariantTierControlValue) => void;
    onTagsChange: (value: string) => void;
}) {
    return (
        <div className="space-y-3">
            <Separator />
            <div className="text-sm font-inter-semibold">Editable fields</div>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <div className="space-y-1.5">
                    <Label htmlFor="variant-label">Label</Label>
                    <Input
                        id="variant-label"
                        value={label}
                        onChange={event => onLabelChange(event.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="variant-tier">Trust Tier</Label>
                    <Select value={trustTier} onValueChange={value => onTrustTierChange(value as TrustTier)} disabled={disabled}>
                        <SelectTrigger id="variant-tier">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TRUST_TIERS.map(option => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {showStockVariantTier ? (
                <div className="space-y-1.5">
                    <Label htmlFor="variant-stock-tier">Stock Variant Tier</Label>
                    <Select
                        value={stockVariantTier}
                        onValueChange={value => onStockVariantTierChange(value as StockVariantTierControlValue)}
                        disabled={disabled}
                    >
                        <SelectTrigger id="variant-stock-tier">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {STOCK_VARIANT_TIERS.map(option => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : null}
            <div className="space-y-1.5">
                <Label htmlFor="variant-tags">Tags</Label>
                <Input
                    id="variant-tags"
                    value={tags}
                    onChange={event => onTagsChange(event.target.value)}
                    disabled={disabled}
                    placeholder="category:equity, curated:stocks"
                />
            </div>
        </div>
    );
}

function DbWriteSummary({
    preview,
    label,
    trustTier,
    stockVariantTier,
    tags,
}: {
    preview: CheckedVariantPreview;
    label: string;
    trustTier: TrustTier;
    stockVariantTier: StockVariantTierControlValue;
    tags: string;
}) {
    const variantFields = [
        ['assetId', preview.variantWrite.assetId],
        ['mint', preview.variantWrite.mint],
        ['variantId', preview.variantWrite.variantId],
        ['kind', preview.variantWrite.kind],
        ['trustTier', trustTier],
        ['stockVariantTier', stockVariantTier === 'none' ? '—' : stockVariantTier],
        ['label', label || '—'],
        ['tags', tags || '—'],
    ] as const;
    const marketFields = [
        ['symbol', preview.marketWrite.symbol],
        ['name', preview.marketWrite.name],
        ['logoURI', preview.marketWrite.logoURI ?? '—'],
        ['decimals', String(preview.marketWrite.decimals)],
        ['liquidity', formatValue(preview.marketWrite.liquidity)],
        ['volume24hUSD', formatValue(preview.marketWrite.volume24hUSD)],
        ['marketCap', formatValue(preview.marketWrite.marketCap)],
        ['lastFetchedAt', new Date(preview.marketWrite.lastFetchedAt).toLocaleString()],
    ] as const;

    return (
        <div className="space-y-3">
            <Separator />
            <div>
                <div className="mb-2 text-sm font-inter-semibold">DB write summary</div>
                <div className="mb-2 text-xs font-inter-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    assetVariants
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {variantFields.map(([labelText, value]) => (
                        <SummaryField key={labelText} label={labelText} value={value} />
                    ))}
                </div>
            </div>
            <div>
                <div className="mb-2 text-xs font-inter-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    variantMarketsLatest
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {marketFields.map(([labelText, value]) => (
                        <SummaryField key={labelText} label={labelText} value={value} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function SummaryField({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-md border border-border-extra-light bg-white px-3 py-2">
            <div className="text-[11px] font-inter-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 truncate text-sm font-inter-medium text-foreground">{value}</div>
        </div>
    );
}

function formatValue(value: number | null): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 8 });
}
