import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

function getArg(name, fallback) {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return fallback;
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
    throw new Error(
        'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
    );
}

const listId = String(getArg('list', 'all')).trim();
const warmVariantMarket = String(getArg('variant-market', 'true')) !== 'false';
const warmMarkets = String(getArg('markets', 'true')) !== 'false';

console.log(
    [
        'Warming curated caches',
        'backend=cloudrun',
        `listId=${listId}`,
        `variantMarket=${warmVariantMarket}`,
        `markets=${warmMarkets}`,
    ].join(' | '),
);

const args = {
    listId,
    variantMarket: warmVariantMarket,
    markets: warmMarkets,
    // Keep it aggressive when you just edited curated lists.
    minAgeMs: 0,
};

const result = await callCloudRun('assets', 'mutation', 'cacheWarmRequestCuratedListWarm', args);

console.log(
    [
        'Scheduled',
        `totalMints=${formatNumber(result.totalMints)}`,
        `scheduled=${result.scheduled.join(',') || '(none)'}`,
        `skipped=${result.skipped.join(',') || '(none)'}`,
    ].join(' | '),
);
