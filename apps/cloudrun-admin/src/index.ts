import { registerGracefulShutdown, wrapFetchWithShutdownGuard } from '@tokens/cloudrun-shutdown';
import { parseAdminClerkUserIds } from './adminAuth';
import { getSql, makePostgresAdminRepo } from './db';
import { makePostgresAdminMutationsRepo } from './db/curatedTokensMutations';
import { makePostgresAdminReadsRepo } from './db/curatedTokensReads';
import { makePostgresHardDeleteRepo } from './db/hardDelete';
import { makeGcsLogoSigner } from './gcs';
import { makeGoogleOidcVerifier } from './oidc';
import { createApp } from './server';

const authToken = process.env.TOKENS_CLOUDRUN_AUTH_TOKEN?.trim();
if (!authToken) {
    console.error('TOKENS_CLOUDRUN_AUTH_TOKEN must be set');
    process.exit(1);
}

const adminClerkUserIds = parseAdminClerkUserIds(process.env.TOKENS_ADMIN_CLERK_USER_IDS);
if (adminClerkUserIds.size === 0) {
    console.warn('TOKENS_ADMIN_CLERK_USER_IDS is empty — every admin endpoint will return 403');
}

const gcsLogoBucket = process.env.GCS_LOGO_BUCKET?.trim();
if (!gcsLogoBucket) {
    console.warn('GCS_LOGO_BUCKET is not set — logo uploads will be unavailable');
}

const port = Number(process.env.PORT) || 8080;
const sql = getSql();
const app = createApp({
    repo: makePostgresAdminRepo(sql),
    reads: makePostgresAdminReadsRepo(sql),
    mutations: makePostgresAdminMutationsRepo(sql),
    hardDelete: makePostgresHardDeleteRepo(sql),
    ...(gcsLogoBucket
        ? { logoSigner: makeGcsLogoSigner(gcsLogoBucket, process.env.GCS_LOGO_PUBLIC_BASE_URL?.trim()) }
        : {}),
    adminClerkUserIds,
    authToken,
    gcpLogs: {
        ...(process.env.LOKI_PUSH_URL?.trim() ? { lokiPushUrl: process.env.LOKI_PUSH_URL.trim() } : {}),
        ...(process.env.LOKI_PUSH_AUTH?.trim() ? { lokiPushAuth: process.env.LOKI_PUSH_AUTH.trim() } : {}),
        ...(process.env.GCP_LOGS_INVOKER_SA?.trim()
            ? { verifyGcpLogsOidc: makeGoogleOidcVerifier({ invokerEmail: process.env.GCP_LOGS_INVOKER_SA.trim() }) }
            : {}),
        envLabel: process.env.TOKENS_ENV?.trim() || 'prd',
    },
});

registerGracefulShutdown({ sql, serviceName: 'cloudrun-admin' });

export default { port, fetch: wrapFetchWithShutdownGuard(app.fetch) };
