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

function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

const baseUrlRaw = getArg('base-url', 'http://localhost:3000');
const baseUrl = baseUrlRaw.endsWith('/') ? baseUrlRaw.slice(0, -1) : baseUrlRaw;

const list = getArg('list', 'all');
const limit = Math.min(Math.max(toInt(getArg('limit', '25'), 25), 1), 200);
const delayMs = Math.max(toInt(getArg('delay-ms', '350'), 350), 0);

let offset = 0;
let page = 0;

let totalFetched = 0;
let totalUpserted = 0;
let totalFailed = 0;

console.log(['Seeding curated tokens', `baseUrl=${baseUrl}`, `list=${list}`, `limit=${limit}`, `delayMs=${delayMs}`].join(' | '));

while (true) {
    page += 1;

    const url = new URL(`${baseUrl}/api/tokens/curated/seed`);
    url.searchParams.set('list', list);
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url, { method: 'POST' });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json) {
        const body = json ? JSON.stringify(json) : '(no json body)';
        throw new Error(`Seed request failed: HTTP ${res.status} ${res.statusText} ${body}`);
    }

    totalFetched += json.fetched ?? 0;
    totalUpserted += json.upserted ?? 0;
    totalFailed += json.failed ?? 0;

    console.log(
        [
            `page=${page}`,
            `processed=${json.processed}/${json.totalAddresses}`,
            `fetched=${json.fetched}`,
            `upserted=${json.upserted}`,
            `failed=${json.failed}`,
            `nextOffset=${json.nextOffset ?? 'null'}`,
        ].join(' | '),
    );

    const errors = Array.isArray(json.errors) ? json.errors : [];
    if (errors.length > 0) {
        console.log('errors(sample):');
        for (const err of errors.slice(0, 8)) {
            if (!err || typeof err !== 'object') continue;
            console.log(`- ${String(err.address)}: ${String(err.message)}`);
        }
    }

    if (json.nextOffset == null) break;
    offset = json.nextOffset;

    if (delayMs > 0) await sleep(delayMs);
}

console.log('\nDone.');
console.log(`totalFetched=${formatNumber(totalFetched)}`);
console.log(`totalUpserted=${formatNumber(totalUpserted)}`);
console.log(`totalFailed=${formatNumber(totalFailed)}`);

