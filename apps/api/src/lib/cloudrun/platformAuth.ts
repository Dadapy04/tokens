import { getCloudRunClient } from './client';

/**
 * Platform API-key auth + usage logging on the authenticated `/v1` hot path
 * (`src/effect/next-route.ts`). Routes to the `cloudrun-usage` service
 * (`apiKeysAuthenticate` / `logApiRequest`), which ports the previous Convex
 * semantics 1:1 against Cloud SQL.
 */

export interface AuthenticateApiKeyResult {
    apiKeyId: string;
    keyPrefix: string;
    projectId: string;
    ownerClerkUserId: string;
    scopes: string[];
    limits?: {
        rateLimit?: { requests: number; windowSeconds: number };
        quota?: { requestsPerMonth: number };
    };
}

export async function authenticateApiKey(keyHash: string): Promise<AuthenticateApiKeyResult | null> {
    return getCloudRunClient().query<AuthenticateApiKeyResult | null>('usage', 'apiKeysAuthenticate', {
        keyHash,
    });
}

export interface LogApiRequestArgs {
    projectId: string;
    apiKeyId: string;
    keyPrefix: string;
    method: string;
    path: string;
    endpoint: string;
    status: number;
    latencyMs: number;
    ts: number;
    errorTag?: string;
}

export async function logApiRequest(args: LogApiRequestArgs): Promise<void> {
    await getCloudRunClient().mutation('usage', 'logApiRequest', { ...args });
}
