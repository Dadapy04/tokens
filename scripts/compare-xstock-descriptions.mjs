import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

function getArg(name, fallback = null) {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return fallback;
}

function slugify(value) {
    return String(value)
        .normalize('NFKD')
        .replace(/['"]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
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

function buildCmcUrl(assetName) {
    return `https://coinmarketcap.com/currencies/${slugify(assetName)}-tokenized-stock-xstock/`;
}

function extractCmcAbout(html, assetName) {
    const heading = `About ${assetName} tokenized stock (xStock)`;
    const idx = html.indexOf(heading);
    if (idx === -1) return null;

    const slice = html.slice(idx, idx + 6000);
    const stopMarkers = [
        'Related CMC AI Articles',
        'Similar Coins to',
        '### Global',
        'Trending',
        'Markets',
        'Holders',
    ];

    let end = slice.length;
    for (const marker of stopMarkers) {
        const markerIdx = slice.indexOf(marker);
        if (markerIdx !== -1) end = Math.min(end, markerIdx);
    }

    let text = normalizeText(slice.slice(0, end));
    if (text.startsWith(heading)) text = text.slice(heading.length).trim();
    return text || null;
}

async function fetchCmcDescription(assetName) {
    const url = buildCmcUrl(assetName);
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!res.ok) return { url, description: null, error: `HTTP ${res.status}` };
    const html = await res.text();
    return { url, description: extractCmcAbout(html, assetName), error: null };
}

async function main() {
    await loadLocalEnv();

    if (!cloudRunEnabled('assets')) {
        throw new Error(
            'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
        );
    }

    const assetIdsArg = getArg('assets', 'apple,nvidia,tesla,microsoft');
    const assetIds = assetIdsArg.split(',').map(v => v.trim()).filter(Boolean);

    for (const assetId of assetIds) {
        const asset = await callCloudRun('assets', 'query', 'getByAssetId', { assetId, includeInactive: true });
        const name = asset?.name?.trim();
        const coinId = asset?.coingeckoId?.trim();

        if (!asset || !name || !coinId) {
            console.log(JSON.stringify({ assetId, error: 'missing asset/name/coingeckoId' }, null, 2));
            continue;
        }

        const coin = await callCloudRun('assets', 'query', 'coingeckoReadsGetCoinById', { id: coinId });
        const coingeckoDescription = normalizeText(coin?.coin?.description?.en ?? '') || null;
        const cmc = await fetchCmcDescription(name);

        console.log(JSON.stringify({
            assetId,
            name,
            coingeckoId: coinId,
            coinmarketcapUrl: cmc.url,
            coingeckoDescription,
            coinmarketcapDescription: cmc.description,
            coinmarketcapError: cmc.error,
        }, null, 2));
    }
}

await main();
