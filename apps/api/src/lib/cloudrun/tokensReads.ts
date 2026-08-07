import type {
    TokenDoc,
    TokenSearchToken,
    GetSearchTokensByAddressesEntry,
    TokenMarketsDoc,
    GetTokenMarketsLatestByMintsEntry,
    GetTopMarketsByMintsEntry,
    TokenDescriptionSummaryDoc,
} from '../../../../cloudrun-assets/src/handlers/tokensReads';

import { getCloudRunClient } from './client';

export type TokensGetByAddressArgs = { address: string };
export type TokensGetByAddressResult = TokenDoc | null;

export async function tokensGetByAddress(args: TokensGetByAddressArgs): Promise<TokensGetByAddressResult> {
    return getCloudRunClient().query<TokensGetByAddressResult>('assets', 'tokensGetByAddress', {
        ...args,
    });
}

export type TokensSearchTokensArgs = { query: string; limit?: number };
export type TokensSearchTokensResult = TokenSearchToken[];

export async function tokensSearchTokens(args: TokensSearchTokensArgs): Promise<TokensSearchTokensResult> {
    return getCloudRunClient().query<TokensSearchTokensResult>('assets', 'tokensSearchTokens', {
        ...args,
    });
}

export type TokensGetSearchTokensByAddressesArgs = { addresses: string[] };
export type TokensGetSearchTokensByAddressesResult = GetSearchTokensByAddressesEntry[];

export async function tokensGetSearchTokensByAddresses(
    args: TokensGetSearchTokensByAddressesArgs,
): Promise<TokensGetSearchTokensByAddressesResult> {
    return getCloudRunClient().query<TokensGetSearchTokensByAddressesResult>(
        'assets',
        'tokensGetSearchTokensByAddresses',
        { ...args },
    );
}

export type TokenMarketsGetLatestByMintArgs = { mint: string };
export type TokenMarketsGetLatestByMintResult = TokenMarketsDoc | null;

export async function tokenMarketsGetLatestByMint(
    args: TokenMarketsGetLatestByMintArgs,
): Promise<TokenMarketsGetLatestByMintResult> {
    return getCloudRunClient().query<TokenMarketsGetLatestByMintResult>(
        'assets',
        'tokenMarketsGetLatestByMint',
        { ...args },
    );
}

export type TokenMarketsGetLatestByMintsArgs = { mints: string[] };
export type TokenMarketsGetLatestByMintsResult = GetTokenMarketsLatestByMintsEntry[];

export async function tokenMarketsGetLatestByMints(
    args: TokenMarketsGetLatestByMintsArgs,
): Promise<TokenMarketsGetLatestByMintsResult> {
    return getCloudRunClient().query<TokenMarketsGetLatestByMintsResult>(
        'assets',
        'tokenMarketsGetLatestByMints',
        { ...args },
    );
}

export type TokenMarketsGetTopMarketsByMintsArgs = { mints: string[] };
export type TokenMarketsGetTopMarketsByMintsResult = GetTopMarketsByMintsEntry[];

export async function tokenMarketsGetTopMarketsByMints(
    args: TokenMarketsGetTopMarketsByMintsArgs,
): Promise<TokenMarketsGetTopMarketsByMintsResult> {
    return getCloudRunClient().query<TokenMarketsGetTopMarketsByMintsResult>(
        'assets',
        'tokenMarketsGetTopMarketsByMints',
        { ...args },
    );
}

export type TokenDescriptionSummariesGetByAddressArgs = { address: string };
export type TokenDescriptionSummariesGetByAddressResult = TokenDescriptionSummaryDoc | null;

export async function tokenDescriptionSummariesGetByAddress(
    args: TokenDescriptionSummariesGetByAddressArgs,
): Promise<TokenDescriptionSummariesGetByAddressResult> {
    return getCloudRunClient().query<TokenDescriptionSummariesGetByAddressResult>(
        'assets',
        'tokenDescriptionSummariesGetByAddress',
        { ...args },
    );
}
