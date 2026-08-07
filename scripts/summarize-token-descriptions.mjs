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

function toBool(value) {
    const v = String(value ?? '').trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'y';
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

const baseUrlRaw = getArg('base-url', 'http://localhost:3000');
const baseUrl = baseUrlRaw.endsWith('/') ? baseUrlRaw.slice(0, -1) : baseUrlRaw;

const address = getArg('address', '');
const list = getArg('list', 'all');
const model = getArg('model', 'gpt-4o-mini');
const limit = Math.min(Math.max(toInt(getArg('limit', '1'), 1), 1), 25);
const delayMs = Math.max(toInt(getArg('delay-ms', '250'), 250), 0);
const force = toBool(getArg('force', '0'));
const dryRun = toBool(getArg('dry-run', '0'));

let offset = 0;
let page = 0;

let totalProcessed = 0;
let totalGenerated = 0;
let totalSkipped = 0;
let totalFailed = 0;

console.log(
    [
        'Summarizing token descriptions',
        `baseUrl=${baseUrl}`,
        `list=${list}`,
        address ? `address=${address}` : `limit=${limit}`,
        `model=${model}`,
        `force=${force}`,
        `dryRun=${dryRun}`,
        `delayMs=${delayMs}`,
    ].join(' | '),
);

while (true) {
    page += 1;

    const url = new URL(`${baseUrl}/api/tokens/descriptions/summarize`);
    url.searchParams.set('model', model);
    if (force) url.searchParams.set('force', '1');
    if (dryRun) url.searchParams.set('dryRun', '1');

    if (address) {
        url.searchParams.set('address', address);
    } else {
        url.searchParams.set('list', list);
        url.searchParams.set('offset', String(offset));
        url.searchParams.set('limit', String(limit));
    }

    const res = await fetch(url, { method: 'POST' });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json) {
        const body = json ? JSON.stringify(json) : '(no json body)';
        throw new Error(`Summarize request failed: HTTP ${res.status} ${res.statusText} ${body}`);
    }

    totalProcessed += json.processed ?? 0;
    totalGenerated += json.generated ?? 0;
    totalSkipped += json.skipped ?? 0;
    totalFailed += json.failed ?? 0;

    console.log(
        [
            `page=${page}`,
            `processed=${json.processed}`,
            `generated=${json.generated}`,
            `skipped=${json.skipped}`,
            `failed=${json.failed}`,
            `nextOffset=${json.nextOffset ?? 'null'}`,
        ].join(' | '),
    );

    const results = Array.isArray(json.results) ? json.results : [];
    if (address && results.length === 1) {
        const r = results[0];
        if (r && r.ok && !r.skipped && typeof r.summary === 'string') {
            console.log('\nsummary:\n');
            console.log(r.summary);
            console.log('');
        } else {
            console.log('\nresult:\n');
            console.log(JSON.stringify(r, null, 2));
            console.log('');
        }
        break;
    }

    if (json.nextOffset == null) break;
    offset = json.nextOffset;

    if (delayMs > 0) await sleep(delayMs);
}

console.log('\nDone.');
console.log(`totalProcessed=${formatNumber(totalProcessed)}`);
console.log(`totalGenerated=${formatNumber(totalGenerated)}`);
console.log(`totalSkipped=${formatNumber(totalSkipped)}`);
console.log(`totalFailed=${formatNumber(totalFailed)}`);

