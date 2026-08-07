export interface PoolProtocolTokenConfig {
    source: string;
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
    match: RegExp;
}

export const POOL_PROTOCOL_TOKENS: readonly PoolProtocolTokenConfig[] = [
    {
        source: 'orca',
        match: /orca/i,
        address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
        symbol: 'ORCA',
        name: 'Orca',
    },
    {
        source: 'raydium',
        match: /raydium/i,
        address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        symbol: 'RAY',
        name: 'Raydium',
    },
    {
        source: 'meteora',
        match: /meteora/i,
        address: 'METvsvVRapdj9cFLzq4Tr43xK4tAjQfwX76z3n6mWQL',
        symbol: 'MET',
        name: 'Meteora',
    },
    {
        source: 'lifinity',
        match: /lifinity|lfinity/i,
        address: 'LFNTYraetVioAPnGJht4yNg2aUZFXR776cMeN9VMjXp',
        symbol: 'LFNTY',
        name: 'Lifinity',
    },
    {
        source: 'humidifi',
        match: /humidifi/i,
        address: 'WETZjtprkDMCcUxPi9PfWnowMRZkiGGHDb9rABuRZ2U',
        symbol: 'WET',
        name: 'WET',
    },
    {
        source: 'marinade',
        match: /marinade|marindade/i,
        address: 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',
        symbol: 'MNDE',
        name: 'Marinade',
    },
] as const;

export function getProtocolTokenFallback(sourceOrAddress: string): PoolProtocolTokenConfig | null {
    const value = sourceOrAddress.trim();
    if (!value) return null;
    return POOL_PROTOCOL_TOKENS.find(config => config.address === value || config.match.test(value)) ?? null;
}
