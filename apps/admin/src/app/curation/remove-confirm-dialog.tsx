'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@tokens/ui/dialog';
import { Button } from '@tokens/ui/button';

interface RemoveConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assetSymbol: string;
    assetId: string;
    onConfirm: () => void;
}

export function RemoveConfirmDialog({ open, onOpenChange, assetSymbol, assetId, onConfirm }: RemoveConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove {assetSymbol}?</DialogTitle>
                    <DialogDescription>
                        This will remove <span className="font-mono text-xs">{assetId}</span> from the category. The
                        asset and its market data will not be deleted.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        Remove
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
