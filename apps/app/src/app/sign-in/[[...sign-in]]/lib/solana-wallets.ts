import { getWallets } from '@wallet-standard/app';

export interface SolanaWalletOption {
    walletName: string;
    label: string;
    iconDataUrl: string | null;
}

export function listSolanaWalletOptions(): Array<SolanaWalletOption> {
    if (typeof window === 'undefined') return [];

    const allWallets = getWallets().get() as unknown;
    if (!Array.isArray(allWallets)) return [];

    const options: Array<SolanaWalletOption> = [];
    const seen = new Set<string>();

    for (const wallet of allWallets) {
        if (!wallet || typeof wallet !== 'object') continue;

        const record = wallet as Record<string, unknown>;
        const name = record.name;
        if (typeof name !== 'string' || !name.trim()) continue;

        const chains = record.chains;
        const features = record.features;

        const hasSolanaChain =
            Array.isArray(chains) && chains.some(chain => typeof chain === 'string' && chain.startsWith('solana:'));
        const hasSolanaFeature =
            features && typeof features === 'object' && Object.keys(features).some(key => key.startsWith('solana:'));

        if (!hasSolanaChain && !hasSolanaFeature) continue;

        if (seen.has(name)) continue;
        seen.add(name);

        const icon = record.icon;
        options.push({
            walletName: name,
            label: name,
            iconDataUrl: typeof icon === 'string' ? icon : null,
        });
    }

    options.sort((a, b) => a.label.localeCompare(b.label));
    return options;
}
