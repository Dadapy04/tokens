export interface SubscriptionTier {
    name: string;
    level: 'free' | 'pro' | 'enterprise';
    color: 'blue' | 'purple' | 'gold';
}

export interface UsageStats {
    totalApiCalls: number;
    totalApiOperationsThisMonth: number;
    assetCallsThisMonth: number;
    assetCallsToday: number;
    averageResponseTime: number;
    uniqueUsers: number;
}

export interface ChartData {
    date: string;
    apiCalls: number;
    assetCalls: number;
    users: number;
}

export interface EndpointPerformance {
    endpoint: string;
    avgTime: number;
    p95: number;
    calls: number;
    trend: 'improving' | 'degrading' | 'stable';
    zone: 'excellent' | 'good' | 'acceptable' | 'slow';
    successRate: number;
}
