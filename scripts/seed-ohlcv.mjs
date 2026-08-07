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
const interval = getArg('interval', '1H');
const days = toInt(getArg('days', '365'), 365);
const limit = Math.min(toInt(getArg('limit', '25'), 25), 200);
const delayMs = Math.max(toInt(getArg('delay-ms', '250'), 250), 0);

let offset = 0;
let page = 0;

let totalFetchedCandles = 0;
let totalInserted = 0;
let totalUpdated = 0;
let totalSkipped = 0;
let totalFailed = 0;

console.log(
    [
        'Seeding OHLCV candles from curated lists',
        `baseUrl=${baseUrl}`,
        `list=${list}`,
        `interval=${interval}`,
        `days=${days}`,
        `limit=${limit}`,
        `delayMs=${delayMs}`,
    ].join(' | '),
);

while (true) {
    page += 1;

    const url = new URL(`${baseUrl}/api/tokens/curated/seed-ohlcv`);
    url.searchParams.set('list', list);
    url.searchParams.set('interval', interval);
    url.searchParams.set('days', String(days));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url, { method: 'POST' });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json) {
        const body = json ? JSON.stringify(json) : '(no json body)';
        throw new Error(`Seed request failed: HTTP ${res.status} ${res.statusText} ${body}`);
    }

    totalFetchedCandles += json.fetchedCandles ?? 0;
    totalInserted += json.inserted ?? 0;
    totalUpdated += json.updated ?? 0;
    totalSkipped += json.skipped ?? 0;
    totalFailed += json.failed ?? 0;

    console.log(
        [
            `page=${page}`,
            `processed=${json.processed}/${json.totalAddresses}`,
            `ok=${json.ok}`,
            `failed=${json.failed}`,
            `fetchedCandles=${formatNumber(json.fetchedCandles ?? 0)}`,
            `inserted=${formatNumber(json.inserted ?? 0)}`,
            `updated=${formatNumber(json.updated ?? 0)}`,
            `skipped=${formatNumber(json.skipped ?? 0)}`,
            `nextOffset=${json.nextOffset ?? 'null'}`,
        ].join(' | '),
    );

    if (json.nextOffset == null) break;

    offset = json.nextOffset;

    if (delayMs > 0) await sleep(delayMs);
}

console.log('\nDone.');
console.log(`totalFetchedCandles=${formatNumber(totalFetchedCandles)}`);
console.log(`totalInserted=${formatNumber(totalInserted)}`);
console.log(`totalUpdated=${formatNumber(totalUpdated)}`);
console.log(`totalSkipped=${formatNumber(totalSkipped)}`);
console.log(`totalFailed=${formatNumber(totalFailed)}`);

