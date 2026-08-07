/**
 * Shared helper for invoking Cloud Run `/jobs/:name` handlers from operator
 * scripts. Jobs are normally triggered by Cloud Scheduler with an OIDC token,
 * so unlike the `/query`/`/mutation` RPC routes (shared bearer token via
 * scripts/_cloudrun.mjs), jobs require a Google identity token whose audience
 * matches the assets service URL.
 *
 * Token resolution order:
 * 1. TOKENS_CLOUDRUN_JOBS_ID_TOKEN — paste a token directly (e.g. from
 *    `gcloud auth print-identity-token --impersonate-service-account=<sa> --audiences=<assets-url> --include-email`).
 * 2. TOKENS_CLOUDRUN_JOBS_INVOKER_SA — impersonate this service account via
 *    gcloud (must be the scheduler/invoker SA the service accepts).
 * 3. Plain `gcloud auth print-identity-token` — works only if the service
 *    accepts your user identity.
 */
import { spawnSync } from 'node:child_process';

function assetsBaseUrl() {
    const base = (process.env.TOKENS_CLOUDRUN_ASSETS_URL ?? '').trim();
    if (!base) throw new Error('Missing TOKENS_CLOUDRUN_ASSETS_URL');
    return base.replace(/\/$/, '');
}

function runGcloud(args) {
    const result = spawnSync('gcloud', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (result.status !== 0) {
        throw new Error(`gcloud ${args.join(' ')} failed: ${String(result.stderr ?? '').slice(0, 300)}`);
    }
    return String(result.stdout ?? '').trim();
}

export function getJobsIdentityToken() {
    const fromEnv = (process.env.TOKENS_CLOUDRUN_JOBS_ID_TOKEN ?? '').trim();
    if (fromEnv) return fromEnv;

    const invokerSa = (process.env.TOKENS_CLOUDRUN_JOBS_INVOKER_SA ?? '').trim();
    if (invokerSa) {
        return runGcloud([
            'auth',
            'print-identity-token',
            `--impersonate-service-account=${invokerSa}`,
            `--audiences=${assetsBaseUrl()}`,
            '--include-email',
        ]);
    }

    return runGcloud(['auth', 'print-identity-token']);
}

export async function callCloudRunJob(name, args = {}, { token } = {}) {
    const idToken = token ?? getJobsIdentityToken();
    const res = await fetch(`${assetsBaseUrl()}/jobs/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(args),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`CloudRun job ${name} failed: HTTP ${res.status} ${body.slice(0, 300)}`);
    }
    return res.json();
}
