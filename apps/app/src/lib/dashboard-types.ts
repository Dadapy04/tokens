/**
 * Dashboard API result types.
 *
 * Hand-copied from the Convex validators (`convex/users.ts`, `convex/projects.ts`,
 * `convex/auth.ts`, `convex/apiKeyActions.ts`) — the cloudrun-usage handlers
 * return the exact same shapes, so these types are backend-agnostic and let the
 * client drop its `@/convex/_generated` imports.
 */

export type ProjectTier = 'free' | 'pro' | 'enterprise';
export type ProjectRole = 'owner' | 'admin' | 'member';

export interface UserDoc {
    _id: string;
    _creationTime: number;
    clerkUserId: string;
    primaryEmail?: string;
    fullName?: string;
    createdAt: number;
    updatedAt: number;
}

export interface ProjectLimits {
    rateLimit?: { requests: number; windowSeconds: number };
    quota?: { requestsPerMonth: number };
}

export interface ProjectDoc {
    _id: string;
    _creationTime: number;
    name: string;
    description?: string;
    tier?: ProjectTier;
    createdByClerkUserId: string;
    personalClerkUserId?: string;
    limits?: ProjectLimits;
    createdAt: number;
    updatedAt: number;
}

export interface ProjectLimitsInfo {
    tier: ProjectTier;
    maxProjects: number;
    currentCount: number;
    canCreateMore: boolean;
}

export interface ProjectApiKeyRow {
    _id: string;
    keyPreview: string;
    createdAt: number;
    isActive: boolean;
    canReveal: boolean;
    deactivatedAt?: number;
}

export type ApiKeyRevealResult =
    | { status: 'ok'; apiKeyId: string; rawKey: string; keyPreview: string }
    | { status: 'unavailable'; reason: 'legacy' | 'inactive' | 'not_found' };

export interface ApiKeyResetResult {
    apiKeyId: string;
    rawKey: string;
    keyPreview: string;
}

export interface UsageStats {
    assetCallsThisMonth: number;
    assetCallsToday: number;
    /** @deprecated Use assetCallsThisMonth. */
    memoriesStored: number;
    memoriesArchived: number;
    totalStorageBytes: number;
    averageMemorySize: number;
    retrievalCalls: number;
    storeCalls: number;
    totalApiCalls: number;
    totalApiOperationsThisMonth: number;
    averageResponseTime: number;
    successRate: number;
    /** @deprecated Use assetCallsToday. */
    memoriesAddedToday: number;
    memoriesAddedThisWeek: number;
    memoriesAddedThisMonth: number;
    uniqueUsers: number;
    monthlyQuotaUsed: number;
    monthlyQuotaLimit: number;
    estimatedMonthlyCost: number;
}

export interface UsageTimeSeriesPoint {
    date: string;
    apiCalls: number;
    assetCalls: number;
    /** @deprecated Use assetCalls. */
    memories: number;
    users: number;
}

export interface EndpointPerformanceRow {
    endpoint: string;
    avgTime: number;
    p95: number;
    calls: number;
    trend: 'improving' | 'degrading' | 'stable';
    zone: 'excellent' | 'good' | 'acceptable' | 'slow';
    successRate: number;
}
