import { Button } from '@tokens/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/app-ui/dialog';

import type { SolanaWalletOption } from '../lib/solana-wallets';

export interface SolanaWalletPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    walletOptions: Array<SolanaWalletOption>;
    isBusy: boolean;
    onPickWallet: (walletName: string) => void;
}

export function SolanaWalletPickerDialog({
    open,
    onOpenChange,
    walletOptions,
    isBusy,
    onPickWallet,
}: SolanaWalletPickerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Choose a Solana wallet</DialogTitle>
                    <DialogDescription>
                        Pick the wallet you want to use for this sign in. This only works for wallets installed in your
                        browser.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    {walletOptions.length > 0 ? (
                        walletOptions.map(wallet => (
                            <Button
                                key={wallet.walletName}
                                type="button"
                                variant="outline"
                                className="w-full justify-start"
                                disabled={isBusy}
                                onClick={() => {
                                    onOpenChange(false);
                                    onPickWallet(wallet.walletName);
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    {wallet.iconDataUrl ? (
                                        <img
                                            alt=""
                                            src={wallet.iconDataUrl}
                                            className="size-4 rounded-sm"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    <span>{wallet.label}</span>
                                </span>
                            </Button>
                        ))
                    ) : (
                        <div className="rounded-md border border-border-medium bg-card p-3 text-sm text-muted-foreground">
                            No Solana wallets detected in this browser.
                        </div>
                    )}
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                    Don’t have a wallet yet?{' '}
                    <a
                        href="https://solana.com/solana-wallets"
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground underline underline-offset-4"
                    >
                        Browse Solana wallets
                    </a>
                    .
                </div>
            </DialogContent>
        </Dialog>
    );
}
