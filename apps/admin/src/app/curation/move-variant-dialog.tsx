'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAdminMutation, useAdminQuery } from '@/hooks/use-admin-api';
import type { CanonicalSearchRow, MoveVariantToCanonicalResult, VariantEditor } from '@/lib/admin-types';
import { Button } from '@tokens/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@tokens/ui/dialog';
import { Label } from '@tokens/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tokens/ui/select';

interface MoveVariantDialogProps {
    mint: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MoveVariantDialog({ mint, open, onOpenChange }: MoveVariantDialogProps): React.JSX.Element {
    const { data: editor } = useAdminQuery<VariantEditor>('getVariantEditor', open && mint ? { mint } : 'skip');
    const { data: canonicalTargets } = useAdminQuery<CanonicalSearchRow[]>(
        'searchCanonicalAssets',
        open ? { query: '', limit: 100 } : 'skip',
    );
    const moveVariantToCanonical = useAdminMutation<MoveVariantToCanonicalResult>('moveVariantToCanonical');

    const [targetAssetId, setTargetAssetId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setTargetAssetId('');
            setIsSubmitting(false);
            return;
        }
        if (editor?.canonical.assetId) setTargetAssetId(editor.canonical.assetId);
    }, [editor?.canonical.assetId, open]);

    const filteredTargets = useMemo(
        () => (canonicalTargets ?? []).filter(target => target.assetId !== editor?.canonical.assetId),
        [canonicalTargets, editor?.canonical.assetId],
    );

    async function onSubmit() {
        if (!mint || !targetAssetId.trim() || !editor) return;
        setIsSubmitting(true);
        const toastId = toast.loading('Moving variant…');
        try {
            const result = await moveVariantToCanonical({ mint, assetId: targetAssetId });
            if (result.moved) {
                toast.success(`Moved ${mint} from ${result.fromAssetId} to ${result.toAssetId}`, { id: toastId });
            } else {
                toast.message(`${mint} is already on ${result.toAssetId}`, { id: toastId });
            }
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : String(error), { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Move Variant</DialogTitle>
                    <DialogDescription>
                        Reassign this mint from its current canonical asset to a new one.
                    </DialogDescription>
                </DialogHeader>

                {!editor ? (
                    <div className="flex items-center justify-center py-10">
                        <Button variant="outline" size="sm" disabled>
                            Loading…
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                            <div>
                                <span className="font-inter-medium">Current canonical:</span> {editor.canonical.assetId}
                            </div>
                            <div>
                                <span className="font-inter-medium">Mint:</span> {editor.variant.mint}
                            </div>
                            <div>
                                <span className="font-inter-medium">Variant:</span> {editor.variant.variantId}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="move-target">Destination canonical</Label>
                            <Select value={targetAssetId} onValueChange={setTargetAssetId}>
                                <SelectTrigger id="move-target">
                                    <SelectValue placeholder="Select canonical asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredTargets.map(target => (
                                        <SelectItem key={target.assetId} value={target.assetId}>
                                            {target.symbol ?? target.assetId} — {target.name ?? target.assetId}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={
                            isSubmitting ||
                            !mint ||
                            !editor ||
                            !targetAssetId ||
                            targetAssetId === editor.canonical.assetId
                        }
                    >
                        {isSubmitting ? 'Moving…' : 'Move Variant'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
