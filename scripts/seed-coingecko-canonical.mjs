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

function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
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

function getOhlcvConfigs(preset, interval, days) {
    const p = String(preset ?? '').trim().toLowerCase();
    if (p === 'none') return [];
    if (p === 'index') return [{ interval: '15m', days: 1 }];
    if (p === 'chart')
        return [
            { interval: '1H', days: 90 },
            { interval: '4H', days: 365 },
            { interval: '1D', days: 365 },
            { interval: '1W', days: 365 },
        ];
    if (p === 'all')
        return [
            { interval: '15m', days: 1 },
            { interval: '1H', days: 90 },
            { interval: '4H', days: 365 },
            { interval: '1D', days: 365 },
            { interval: '1W', days: 365 },
        ];
    if (p === 'custom') {
        const i = String(interval ?? '').trim();
        const d = Number(days);
        if (!i) throw new Error('Missing --ohlcv-interval for --ohlcv-preset custom');
        if (!Number.isFinite(d) || d <= 0) throw new Error('Missing/invalid --ohlcv-days for --ohlcv-preset custom');
        return [{ interval: i, days: d }];
    }
    throw new Error(`Unknown --ohlcv-preset: ${preset} (expected none|index|chart|all|custom)`);
}

function ohlcvJobName(interval) {
    // Job names exist per interval; all route to the same handler which reads
    // args.interval — pick the matching name for clean telemetry.
    const suffix = String(interval).trim().toLowerCase();
    const known = new Set(['15m', '1h', '4h', '1d', '1w']);
    return known.has(suffix) ? `refresh-curated-coingecko-ohlcv-${suffix}` : 'refresh-curated-coingecko-ohlcv-1h';
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
    throw new Error(
        'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
    );
}

const seedPrices = toBool(getArg('prices', 'true'), true);
const seedOhlcv = toBool(getArg('ohlcv', 'true'), true);

const pageDelayMs = Math.max(toInt(getArg('page-delay-ms', '0'), 0), 0);

// Prices (explicit coinIds per job call are capped server-side at 250).
const pricePageSize = Math.min(Math.max(toInt(getArg('price-page-size', '250'), 250), 1), 250);
const priceMinAgeMs = Math.max(toInt(getArg('price-min-age-ms', '0'), 0), 0);
const priceChunkSize = Math.min(Math.max(toInt(getArg('price-chunk-size', '200'), 200), 1), 250);
const priceDelayMs = Math.max(toInt(getArg('price-delay-ms', '150'), 150), 0);

// OHLCV
const ohlcvPreset = String(getArg('ohlcv-preset', 'index')).trim();
const ohlcvInterval = getArg('ohlcv-interval', '');
const ohlcvDays = toInt(getArg('ohlcv-days', '1'), 1);
const ohlcvPageSize = Math.min(Math.max(toInt(getArg('ohlcv-page-size', '20'), 20), 1), 250);
const ohlcvConcurrency = Math.min(Math.max(toInt(getArg('ohlcv-concurrency', '2'), 2), 1), 5);
const ohlcvDelayMs = Math.max(toInt(getArg('ohlcv-delay-ms', '250'), 250), 0);
const ohlcvUpsertChunkSize = Math.min(Math.max(toInt(getArg('ohlcv-upsert-chunk-size', '500'), 500), 50), 2000);

const ohlcvConfigs = getOhlcvConfigs(ohlcvPreset, ohlcvInterval, ohlcvDays);

// Derive the full curated coin list client-side, then page over it with
// explicit coinIds so every coin is covered exactly once (the jobs' default
// selection is a time-rotating batch meant for Cloud Scheduler).
const entries = await callCloudRun('assets', 'query', 'listActiveWithCoinGeckoIds', { limit: 5000 });
const coinIds = uniqueStrings((Array.isArray(entries) ? entries : []).map(e => e.coingeckoId));

console.log(
    [
        'Seeding CoinGecko canonical caches via Cloud Run jobs',
        `coins=${formatNumber(coinIds.length)}`,
        `prices=${seedPrices}`,
        `ohlcv=${seedOhlcv}`,
        seedPrices
            ? `price(pageSize=${pricePageSize},minAgeMs=${priceMinAgeMs},chunkSize=${priceChunkSize},delayMs=${priceDelayMs})`
            : 'price(disabled)',
        seedOhlcv
            ? `ohlcv(preset=${ohlcvPreset},pageSize=${ohlcvPageSize},concurrency=${ohlcvConcurrency},delayMs=${ohlcvDelayMs})`
            : 'ohlcv(disabled)',
        `pageDelayMs=${pageDelayMs}`,
    ].join(' | '),
);

if (coinIds.length === 0) {
    console.log('No curated coins with CoinGecko ids found. Run registry seeding first.');
    process.exit(0);
}

const token = getJobsIdentityToken();

if (seedPrices) {
    const pages = chunk(coinIds, pricePageSize);
    const totals = { processed: 0, refreshed: 0, skipped: 0, failed: 0 };

    for (let i = 0; i < pages.length; i++) {
        const json = await callCloudRunJob(
            'refresh-curated-coingecko-prices',
            {
                coinIds: pages[i],
                minAgeMs: priceMinAgeMs,
                chunkSize: priceChunkSize,
                delayMs: priceDelayMs,
            },
            { token },
        );

        totals.processed += Number(json.processed ?? 0);
        totals.refreshed += Number(json.refreshed ?? 0);
        totals.skipped += Number(json.skipped ?? 0);
        totals.failed += Number(json.failed ?? 0);

        console.log(
            [
                `prices page=${i + 1}/${pages.length}`,
                `processed=${formatNumber(totals.processed)}/${formatNumber(coinIds.length)}`,
                `refreshed=${formatNumber(totals.refreshed)}`,
                `skipped=${formatNumber(totals.skipped)}`,
                `failed=${formatNumber(totals.failed)}`,
            ].join(' | '),
        );

        await sleep(pageDelayMs);
    }
}

if (seedOhlcv) {
    for (const cfg of ohlcvConfigs) {
        const pages = chunk(coinIds, ohlcvPageSize);
        const totals = { processed: 0, refreshed: 0, skipped: 0, failed: 0 };

        for (let i = 0; i < pages.length; i++) {
            const json = await callCloudRunJob(
                ohlcvJobName(cfg.interval),
                {
                    interval: cfg.interval,
                    days: cfg.days,
                    coinIds: pages[i],
                    concurrency: ohlcvConcurrency,
                    delayMs: ohlcvDelayMs,
                    upsertChunkSize: ohlcvUpsertChunkSize,
                },
                { token },
            );

            totals.processed += Number(json.processed ?? 0);
            totals.refreshed += Number(json.refreshed ?? 0);
            totals.skipped += Number(json.skipped ?? 0);
            totals.failed += Number(json.failed ?? 0);

            console.log(
                [
                    `ohlcv(${cfg.interval},${cfg.days}d) page=${i + 1}/${pages.length}`,
                    `processed=${formatNumber(totals.processed)}/${formatNumber(coinIds.length)}`,
                    `refreshed=${formatNumber(totals.refreshed)}`,
                    `skipped=${formatNumber(totals.skipped)}`,
                    `failed=${formatNumber(totals.failed)}`,
                ].join(' | '),
            );

            await sleep(pageDelayMs);
        }
    }
}

console.log('\nDone.');
console.log(
    'If this failed with a COINGECKO_API_KEY error, set it on the cloudrun-assets service (Doppler / terraform env).',
);
