import 'server-only';

/**
 * Registry of dashboard functions served by `/api/dashboard/[fn]`.
 * Each entry names the Cloud Run usage query/mutation (name equals `fn`) and
 * whether it should be dispatched as a query or a mutation.
 */

export type DashboardFnKind = 'query' | 'mutation';

export interface DashboardFnSpec {
    kind: DashboardFnKind;
}

export const DASHBOARD_FNS: Record<string, DashboardFnSpec> = {
    // users.*
    usersGetMe: { kind: 'query' },
    usersUpsertMe: { kind: 'mutation' },
    usersGetUserProjectLimits: { kind: 'query' },
    usersGetProjectById: { kind: 'query' },
    usersGetAllProjectApiKeys: { kind: 'query' },
    usersCreateProjectWithApiKey: { kind: 'mutation' },
    usersUpdateProject: { kind: 'mutation' },
    usersDeleteProject: { kind: 'mutation' },

    // projects.*
    projectsListMine: { kind: 'query' },
    projectsGetOrCreatePersonalProject: { kind: 'mutation' },

    // apiKeys.* / apiKeyActions.*
    apiKeysRevoke: { kind: 'mutation' },
    apiKeysReset: { kind: 'mutation' },
    apiKeysReveal: { kind: 'query' },

    // usage dashboards
    usageGetProjectUsageStats: { kind: 'query' },
    usageGetProjectUsageTimeSeries: { kind: 'query' },
    usageGetEndpointPerformance: { kind: 'query' },
};
