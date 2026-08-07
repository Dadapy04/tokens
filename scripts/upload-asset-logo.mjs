/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

await loadLocalEnv();

function getArg(name, fallback) {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return fallback;
}

function normalizeFilePath(value) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return '';
    return path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
}

function inferContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
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
            return '';
    }
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

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const assetId = String(getArg('asset-id', '')).trim();
assert(assetId, 'Missing --asset-id');

const filePath = normalizeFilePath(getArg('file', ''));
assert(filePath, 'Missing --file');

const contentTypeOverride = String(getArg('content-type', '')).trim();
const contentType = contentTypeOverride || inferContentType(filePath);
assert(
    contentType === 'image/png' ||
        contentType === 'image/jpeg' ||
        contentType === 'image/webp' ||
        contentType === 'image/svg+xml' ||
        contentType === 'image/gif',
    `Unsupported image type (expected png/jpg/webp/svg/gif). Pass --content-type to override. file=${filePath}`,
);

const bytes = await fs.readFile(filePath);
assert(bytes.byteLength > 0, `File is empty: ${filePath}`);

assert(
    cloudRunEnabled('assets'),
    'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
);

console.log(
    [
        'Uploading asset logo',
        'backend=gcs+cloudrun',
        `assetId=${assetId}`,
        `file=${path.basename(filePath)}`,
        `type=${contentType}`,
    ].join(' | '),
);

// GCS path: `gcloud storage cp` into the public logo bucket, then persist
// the public URL via the assets service.
const bucket = (process.env.GCS_LOGO_BUCKET ?? '').trim();
assert(bucket, 'Missing GCS_LOGO_BUCKET');
const publicBase = (process.env.GCS_LOGO_PUBLIC_BASE_URL ?? `https://storage.googleapis.com/${bucket}`).replace(
    /\/$/,
    '',
);

const objectName = `logos/${assetId}/${Date.now()}-upload.${extForContentType(contentType)}`;
const upload = spawnSync(
    'gcloud',
    ['storage', 'cp', `--content-type=${contentType}`, filePath, `gs://${bucket}/${objectName}`],
    { stdio: ['ignore', 'pipe', 'pipe'] },
);
assert(upload.status === 0, `gcloud storage cp failed: ${upload.stderr?.toString().slice(0, 300)}`);

const imageUrl = `${publicBase}/${objectName}`;
await callCloudRun('assets', 'mutation', 'cacheWarmSetAssetLogoUrl', { assetId, imageUrl });

const updated = await callCloudRun('assets', 'query', 'getByAssetId', { assetId, includeInactive: true });
console.log(JSON.stringify({ ok: true, assetId, imageUrl, imageUrlPersisted: updated?.imageUrl ?? null }, null, 2));
