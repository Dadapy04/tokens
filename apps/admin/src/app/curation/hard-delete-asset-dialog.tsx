'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAdminMutation } from '@/hooks/use-admin-api';
import type { HardDeleteAssetResult } from '@/lib/admin-types';
import { Button } from '@tokens/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@tokens/ui/dialog';
import { Input } from '@tokens/ui/input';

interface HardDeleteAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assetId: string;
    assetSymbol: string;
}

export function HardDeleteAssetDialog({
    open,
    onOpenChange,
    assetId,
    assetSymbol,
}: HardDeleteAssetDialogProps): React.JSX.Element {
    const hardDeleteAsset = useAdminMutation<HardDeleteAssetResult>('hardDeleteAsset');

    const [confirmation, setConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (open) return;
        setConfirmation('');
        setIsDeleting(false);
    }, [open]);

    async function onConfirm() {
        if (confirmation.trim() !== assetId) return;

        setIsDeleting(true);
        const toastId = toast.loading(`Deleting ${assetId} and related rows…`);

        try {
            let deletedRowCount = 0;
            let result: Awaited<ReturnType<typeof hardDeleteAsset>>;

            do {
                result = await hardDeleteAsset({ assetId });
                deletedRowCount +=
                    result.membershipsDeleted +
                    result.aliasesDeleted +
                    result.variantsDeleted +
                    result.variantMarketsDeleted +
                    result.tokenMarketsDeleted +
                    result.tokenDocsDeleted +
                    result.tokenDescriptionSummariesDeleted +
                    result.assetRiskDeleted +
                    result.ohlcvDeleted +
                    result.webacyDeleted +
                    result.rwaTokenCacheDeleted +
                    result.rwaAssetCacheDeleted +
                    result.assetMarketDeleted +
                    result.coingeckoPricesDeleted +
                    result.coingeckoTickersDeleted +
                    result.coingeckoOhlcvDeleted;

                if (!result.deleted) {
                    toast.loading(`Deleting ${assetId} history… Removed ${deletedRowCount} row(s).`, { id: toastId });
                }
            } while (!result.deleted);

            deletedRowCount += 1;

            toast.success(`Deleted ${assetId}. Removed ${deletedRowCount} row(s).`, { id: toastId });
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : String(error), { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hard Delete {assetSymbol}?</DialogTitle>
                    <DialogDescription>
                        This permanently deletes the asset row, variants, list memberships, aliases, mint market caches,
                        OHLCV candles, risk caches, token docs, and CoinGecko cache rows tied to this asset.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Type <span className="font-mono text-foreground">{assetId}</span> to confirm.
                    </p>
                    <Input
                        value={confirmation}
                        onChange={event => setConfirmation(event.target.value)}
                        placeholder={assetId}
                        disabled={isDeleting}
                        autoFocus
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting || confirmation.trim() !== assetId}
                    >
                        {isDeleting ? 'Deleting…' : 'Delete Asset'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
