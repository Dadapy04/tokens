import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';
import { callCloudRunJob, getJobsIdentityToken } from './_jobs.mjs';

function getArg(name, fallback) {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];

    const envKey = `SEED_${name.toUpperCase().replaceAll('-', '_')}`;
    if (process.env[envKey]) return process.env[envKey];

    return fallback;
}

function toInt(value, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback) {
    if (value == null) return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return fallback;
}

function uniqueStrings(values) {
    const out = [];
    const seen = new Set();
    for (const value of values) {
        const trimmed = String(value ?? '').trim();
        if (!trimmed) continue;
        if (seen.has(trimmed)) continue;
        seen.add(trimmed);
        out.push(trimmed);
    }
    return out;
}

function chunk(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

async function sleep(ms) {
    if (ms <= 0) return;
    await new Promise(resolve => setTimeout(resolve, ms));
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
    throw new Error(
        'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
    );
}

// Explicit coinIds per job call are capped server-side at 250.
const pageSize = Math.min(Math.max(toInt(getArg('page-size', '200'), 200), 1), 250);
const concurrency = Math.min(Math.max(toInt(getArg('concurrency', '5'), 5), 1), 5);
const delayMs = Math.max(toInt(getArg('delay-ms', '0'), 0), 0);
const minAgeMs = Math.max(toInt(getArg('min-age-ms', String(7 * 24 * 60 * 60 * 1000)), 7 * 24 * 60 * 60 * 1000), 0);

const localization = toBool(getArg('localization', 'false'), false);
const marketData = toBool(getArg('market-data', 'true'), true);

const pageDelayMs = Math.max(toInt(getArg('page-delay-ms', '0'), 0), 0);

// Derive the full curated coin list client-side, then page over it with
// explicit coinIds so every coin is covered exactly once (the job's default
// selection is a time-rotating batch meant for Cloud Scheduler).
const entries = await callCloudRun('assets', 'query', 'listActiveWithCoinGeckoIds', { limit: 5000 });
const coinIds = uniqueStrings((Array.isArray(entries) ? entries : []).map(e => e.coingeckoId));

console.log(
    [
        'Backfilling CoinGecko /coins/{id} metadata via Cloud Run job',
        `coins=${coinIds.length}`,
        `pageSize=${pageSize}`,
        `minAgeMs=${minAgeMs}`,
        `concurrency=${concurrency}`,
        `delayMs=${delayMs}`,
        `pageDelayMs=${pageDelayMs}`,
        `localization=${localization}`,
        `marketData=${marketData}`,
    ].join(' | '),
);

if (coinIds.length === 0) {
    console.log('No curated coins with CoinGecko ids found. Run registry seeding first.');
    process.exit(0);
}

const token = getJobsIdentityToken();

const pages = chunk(coinIds, pageSize);
let totalProcessed = 0;
let totalRefreshed = 0;
let totalFailed = 0;
let totalSkipped = 0;

for (let i = 0; i < pages.length; i++) {
    const json = await callCloudRunJob(
        'refresh-curated-coingecko-metadata',
        { coinIds: pages[i], minAgeMs, concurrency, delayMs, localization, marketData },
        { token },
    );

    totalProcessed += Number(json.processed ?? 0);
    totalRefreshed += Number(json.refreshed ?? 0);
    totalFailed += Number(json.failed ?? 0);
    totalSkipped += Number(json.skipped ?? 0);

    console.log(
        [
            `page=${i + 1}/${pages.length}`,
            `processed=${json.processed ?? 0}`,
            `refreshed=${json.refreshed ?? 0}`,
            `skipped=${json.skipped ?? 0}`,
            `failed=${json.failed ?? 0}`,
        ].join(' | '),
    );

    await sleep(pageDelayMs);
}

console.log('\nDone.');
console.log(`totalProcessed=${totalProcessed}`);
console.log(`totalRefreshed=${totalRefreshed}`);
console.log(`totalSkipped=${totalSkipped}`);
console.log(`totalFailed=${totalFailed}`);
console.log(
    'If this failed with a COINGECKO_API_KEY error, set it on the cloudrun-assets service (Doppler / terraform env).',
);
