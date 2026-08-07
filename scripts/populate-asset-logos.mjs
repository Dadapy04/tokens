/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

function getArg(name, fallback) {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return fallback;
}

function getFlag(name) {
    return process.argv.includes(`--${name}`);
}

function toInt(value, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
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

async function mapWithConcurrency(items, concurrency, mapper) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const idx = nextIndex;
            if (idx >= items.length) return;

            nextIndex += 1;
            results[idx] = await mapper(items[idx], idx);
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

function extForContentType(contentType) {
    switch (contentType) {
        case 'image/png':
            return 'png';
        case 'image/jpeg':
            return 'jpg';
        case 'image/webp':
            return 'webp';
        case 'image/svg+xml':
            return 'svg';
        case 'image/gif':
            return 'gif';
        default:
            return 'png';
    }
}

function normalizeContentType(raw, url) {
    const type = String(raw ?? '')
        .split(';')[0]
        .trim()
        .toLowerCase();
    if (['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'].includes(type)) return type;

    const ext = path.extname(new URL(url).pathname).toLowerCase();
    switch (ext) {
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.webp':
            return 'image/webp';
        case '.svg':
            return 'image/svg+xml';
        case '.gif':
            return 'image/gif';
        default:
            return null;
    }
}

async function fetchWithRetry(url, options, maxRetries = 4) {
    /** @type {Error | null} */
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        const res = await fetch(url, options);
        if (res.ok) return res;

        if (res.status === 429) {
            await sleep(Math.pow(2, attempt) * 1000);
            lastError = new Error(`Rate limited: ${res.status} ${res.statusText}`);
            continue;
        }

        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}${body ? `\n${body.slice(0, 200)}` : ''}`);
    }

    throw lastError ?? new Error('Max retries exceeded');
}

async function getBirdeyeLogoUri(mint, apiKey) {
    const url = `https://public-api.birdeye.so/defi/token_overview?address=${encodeURIComponent(mint)}`;
    const res = await fetchWithRetry(url, {
        headers: {
            'X-API-KEY': apiKey,
            'x-chain': 'solana',
            Accept: 'application/json',
        },
    });

    const json = await res.json().catch(() => null);
    const data = json?.data;
    if (!json?.success || !data) throw new Error('Birdeye returned an unsuccessful response');

    const logoUri = typeof data.logoURI === 'string' ? data.logoURI.trim() : '';
    return logoUri || null;
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
    throw new Error(
        'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
    );
}

const listId = String(getArg('list', 'all')).trim();
const offset = Math.max(toInt(getArg('offset', '0'), 0), 0);
const limitRaw = getArg('limit', null);
const concurrency = Math.min(Math.max(toInt(getArg('concurrency', '2'), 2), 1), 5);
const delayMs = Math.max(toInt(getArg('delay-ms', '200'), 200), 0);
const force = getFlag('force');
const dryRun = getFlag('dry-run');

const collectionMembers = await callCloudRun('assets', 'query', 'assetCollectionsGetMembers', {
    slug: listId,
    limit: 2000,
});
const uniqueAssetIds = uniqueStrings(Array.isArray(collectionMembers) ? collectionMembers : []);
if (uniqueAssetIds.length === 0) {
    throw new Error(
        `No assets found for list="${listId}". Ensure registry seeding has run (e.g. node scripts/seed-registry.mjs).`,
    );
}

const limit = limitRaw ? Math.max(toInt(limitRaw, uniqueAssetIds.length), 1) : uniqueAssetIds.length;
const selectedAssetIds = uniqueAssetIds.slice(offset, offset + limit);

console.log(
    [
        'Populating asset logos',
        'backend=gcs+cloudrun',
        `list=${listId}`,
        `totalAssets=${formatNumber(uniqueAssetIds.length)}`,
        `selected=${formatNumber(selectedAssetIds.length)}`,
        `offset=${offset}`,
        `limit=${limit}`,
        `concurrency=${concurrency}`,
        `delayMs=${delayMs}`,
        `force=${force}`,
        `dryRun=${dryRun}`,
    ].join(' | '),
);

if (selectedAssetIds.length === 0) {
    console.log('Nothing selected after offset/limit.');
    process.exit(0);
}

// Skip assets that already have a logo unless --force.
const assetsById = new Map();
for (const batch of chunk(selectedAssetIds, 500)) {
    const rows = await callCloudRun('assets', 'query', 'getByAssetIds', { assetIds: batch, includeInactive: true });
    for (const row of rows) assetsById.set(row.assetId, row.asset);
}

const targets = selectedAssetIds.filter(assetId => {
    const asset = assetsById.get(assetId);
    if (!asset) return false;
    if (force) return true;
    const imageUrl = typeof asset.imageUrl === 'string' ? asset.imageUrl.trim() : '';
    return imageUrl.length === 0;
});

console.log(`needsLogo=${formatNumber(targets.length)}/${formatNumber(selectedAssetIds.length)}`);

if (targets.length === 0) {
    console.log('Nothing to do.');
    process.exit(0);
}

if (dryRun) {
    console.log(`dry-run asset ids sample: ${targets.slice(0, 10).join(', ')}`);
    process.exit(0);
}

const apiKey = (process.env.BIRDEYE_API_KEY ?? '').trim();
if (!apiKey) throw new Error('Missing BIRDEYE_API_KEY');

const bucket = (process.env.GCS_LOGO_BUCKET ?? '').trim();
if (!bucket) throw new Error('Missing GCS_LOGO_BUCKET');
const publicBase = (process.env.GCS_LOGO_PUBLIC_BASE_URL ?? `https://storage.googleapis.com/${bucket}`).replace(
    /\/$/,
    '',
);

// Resolve a mint for each target asset via its variants.
const mintByAssetId = new Map();
for (const batch of chunk(targets, 250)) {
    const rows = await callCloudRun('assets', 'query', 'assetVariantsListByAssetIds', {
        assetIds: batch,
        includeInactive: true,
    });
    for (const row of rows) {
        const variants = Array.isArray(row.variants) ? row.variants : [];
        const preferred = variants.find(v => v?.isDefault) ?? variants[0];
        const mint = typeof preferred?.mint === 'string' ? preferred.mint.trim() : '';
        if (mint) mintByAssetId.set(row.assetId, mint);
    }
}

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-logos-'));

let uploaded = 0;
let skipped = 0;
let failed = 0;
const errors = [];

await mapWithConcurrency(targets, concurrency, async assetId => {
    try {
        const mint = mintByAssetId.get(assetId);
        if (!mint) {
            skipped += 1;
            return;
        }

        const logoUri = await getBirdeyeLogoUri(mint, apiKey);
        if (!logoUri) {
            skipped += 1;
            return;
        }

        const res = await fetchWithRetry(logoUri, {});
        const contentType = normalizeContentType(res.headers.get('content-type'), logoUri);
        if (!contentType) throw new Error(`Unsupported logo content type for ${logoUri}`);

        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.byteLength === 0) throw new Error(`Empty logo body from ${logoUri}`);

        const ext = extForContentType(contentType);
        const localPath = path.join(tmpDir, `${assetId.replaceAll('/', '_')}.${ext}`);
        await fs.writeFile(localPath, bytes);

        const objectName = `logos/${assetId}/${Date.now()}-birdeye.${ext}`;
        const upload = spawnSync(
            'gcloud',
            ['storage', 'cp', `--content-type=${contentType}`, localPath, `gs://${bucket}/${objectName}`],
            { stdio: ['ignore', 'pipe', 'pipe'] },
        );
        if (upload.status !== 0) {
            throw new Error(`gcloud storage cp failed: ${upload.stderr?.toString().slice(0, 300)}`);
        }

        const imageUrl = `${publicBase}/${objectName}`;
        await callCloudRun('assets', 'mutation', 'cacheWarmSetAssetLogoUrl', { assetId, imageUrl });

        uploaded += 1;
        console.log(`uploaded ${assetId} -> ${imageUrl}`);
    } catch (error) {
        failed += 1;
        errors.push({ assetId, message: error instanceof Error ? error.message : String(error) });
    } finally {
        await sleep(delayMs);
    }
});

await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

console.log('\nDone.');
console.log(`uploaded=${formatNumber(uploaded)}`);
console.log(`skipped=${formatNumber(skipped)}`);
console.log(`failed=${formatNumber(failed)}`);
if (errors.length > 0) {
    console.log('\nerrors(sample):');
    for (const err of errors.slice(0, 20)) {
        console.log(`- ${err.assetId}: ${err.message}`);
    }
}
