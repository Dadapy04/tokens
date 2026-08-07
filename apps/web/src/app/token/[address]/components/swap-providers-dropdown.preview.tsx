import { defineComponentPreview } from '../../../../../../../.forma/preview/config';

export default defineComponentPreview({
    component: './swap-providers-dropdown.tsx',
    componentExport: 'SwapProvidersDropdown',
    scenarios: [
        {
            id: 'default',
            name: 'Default',
            args: {
                buyAddress: 'So11111111111111111111111111111111111111112',
                buyName: 'Solana',
            },
            env: {
                pathname: '/token/So11111111111111111111111111111111111111112',
                searchParams: {},
            },
        },
        {
            id: 'variant-view',
            name: 'Variant View',
            args: {
                buyAddress: 'So11111111111111111111111111111111111111112',
                buyName: 'Solana',
            },
            env: {
                pathname: '/token/So11111111111111111111111111111111111111112',
                searchParams: {
                    solana: '1',
                },
            },
        },
    ],
    controls: [
        {
            name: 'buyName',
            label: 'Buy label',
            type: 'text',
            defaultValue: 'Solana',
        },
        {
            name: 'buyAddress',
            label: 'Token address',
            type: 'select',
            defaultValue: 'So11111111111111111111111111111111111111112',
            options: [
                {
                    label: 'SOL',
                    value: 'So11111111111111111111111111111111111111112',
                },
                {
                    label: 'USDC',
                    value: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                },
                {
                    label: 'Unknown token',
                    value: 'PreviewUnknownToken11111111111111111111111111',
                },
            ],
        },
    ],
    moduleMocks: {
        'next/navigation': '../../../../../../../.forma/preview/mocks.ts',
    },
});
