/**
 * Shared Cloud Run backend selection for operator scripts.
 *
 * When TOKENS_CLOUDRUN_ENABLED=true (or the relevant service URL is set),
 * scripts call the bearer-authed Cloud Run services instead of Convex.
 */

const SERVICE_URL_ENV = {
    assets: 'TOKENS_CLOUDRUN_ASSETS_URL',
    prices: 'TOKENS_CLOUDRUN_PRICES_URL',
    usage: 'TOKENS_CLOUDRUN_USAGE_URL',
    admin: 'TOKENS_CLOUDRUN_ADMIN_URL',
};

export function cloudRunEnabled(service) {
    const flag = (process.env.TOKENS_CLOUDRUN_ENABLED ?? '').trim().toLowerCase() === 'true';
    const url = (process.env[SERVICE_URL_ENV[service]] ?? '').trim();
    return flag || Boolean(url);
}

export async function callCloudRun(service, kind, name, args = {}) {
    const urlEnv = SERVICE_URL_ENV[service];
    const base = (process.env[urlEnv] ?? '').trim();
    if (!base) throw new Error(`Missing ${urlEnv}`);
    const authToken = (process.env.TOKENS_CLOUDRUN_AUTH_TOKEN ?? '').trim();
    if (!authToken) throw new Error('Missing TOKENS_CLOUDRUN_AUTH_TOKEN');

    const res = await fetch(`${base.replace(/\/$/, '')}/${kind}/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(args),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`CloudRun ${kind} ${service}.${name} failed: HTTP ${res.status} ${body.slice(0, 300)}`);
    }
    return res.json();
}
