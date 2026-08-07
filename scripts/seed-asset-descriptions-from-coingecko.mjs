import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';
import { callCloudRunJob, getJobsIdentityToken } from './_jobs.mjs';

function getArg(name, fallback) {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return fallback;
}

function toBool(value, fallback) {
    if (value == null) return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return fallback;
}

function toInt(value, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value) {
    return String(value ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function uniqueBy(items, keyFn) {
    const out = [];
    const seen = new Set();
    for (const item of items) {
        const key = keyFn(item);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

function chunk(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
    throw new Error(
        'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
    );
}

const overwrite = toBool(getArg('overwrite', 'true'), true);
const refreshFirst = toBool(getArg('refresh-first', 'true'), true);
const limit = Math.min(Math.max(toInt(getArg('limit', '1000'), 1000), 1), 5000);
const dryRun = toBool(getArg('dry-run', 'false'), false);

// Assets with CoinGecko ids (also carries the current description).
const entries = await callCloudRun('assets', 'query', 'listActiveWithCoinGeckoIds', { limit });
const targets = uniqueBy(
    (Array.isArray(entries) ? entries : []).filter(e => (e.coingeckoId ?? '').trim()),
    e => e.assetId,
);

console.log(
    [
        'Seeding asset descriptions from CoinGecko',
        `assets=${targets.length}`,
        `overwrite=${overwrite}`,
        `refreshFirst=${refreshFirst}`,
        `dryRun=${dryRun}`,
    ].join(' | '),
);

if (targets.length === 0) {
    console.log('No assets with CoinGecko ids found. Run registry seeding first.');
    process.exit(0);
}

if (refreshFirst) {
    console.log('Refreshing CoinGecko metadata via Cloud Run job...');
    const token = getJobsIdentityToken();
    const coinIds = uniqueBy(targets, e => e.coingeckoId).map(e => e.coingeckoId);
    // Explicit coinIds per job call are capped server-side at 250.
    for (const page of chunk(coinIds, 250)) {
        const result = await callCloudRunJob(
            'refresh-curated-coingecko-metadata',
            { coinIds: page, minAgeMs: 0, concurrency: 5, delayMs: 0, localization: false, marketData: true },
            { token },
        );
        console.log(
            [
                `metadata refreshed=${result.refreshed ?? 0}`,
                `skipped=${result.skipped ?? 0}`,
                `failed=${result.failed ?? 0}`,
            ].join(' | '),
        );
    }
}

let updated = 0;
let skippedExisting = 0;
let skippedMissing = 0;
let unchanged = 0;

for (const entry of targets) {
    const existing = normalizeText(entry.description ?? '');
    if (existing && !overwrite) {
        skippedExisting += 1;
        continue;
    }

    const coin = await callCloudRun('assets', 'query', 'coingeckoReadsGetCoinById', { id: entry.coingeckoId });
    const description = normalizeText(coin?.coin?.description?.en ?? '');
    if (!description) {
        skippedMissing += 1;
        continue;
    }

    if (existing === description) {
        unchanged += 1;
        continue;
    }

    console.log(
        JSON.stringify({
            assetId: entry.assetId,
            coingeckoId: entry.coingeckoId,
            dryRun,
            previousLength: existing.length,
            nextLength: description.length,
        }),
    );

    if (!dryRun) {
        await callCloudRun('assets', 'mutation', 'setAssetDescriptionByAssetId', {
            assetId: entry.assetId,
            description,
        });
    }
    updated += 1;
}

console.log(
    JSON.stringify(
        { updated, unchanged, skippedExisting, skippedMissing, total: targets.length },
        null,
        2,
    ),
);
