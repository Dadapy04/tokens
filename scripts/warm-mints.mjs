import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

function getArg(name, fallback) {
  const flag = `--${name}`;
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];

  const envKey = `SEED_${name.toUpperCase().replaceAll('-', '_')}`;
  if (process.env[envKey]) return process.env[envKey];

  return fallback;
}

function parseMints(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return [];
  return text
    .split(/[,\s]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

function dedupe(values) {
  const unique = [];
  const seen = new Set();
  for (const value of values) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
  throw new Error(
    'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
  );
}

const mints = dedupe(parseMints(getArg('mints', ''))).slice(0, 200);
if (mints.length === 0) {
  throw new Error('Missing --mints. Example: --mints suifhC9gU1VbJAPYPTBkHJyyyStKGLLYPVDTmPoqbvA');
}

const warmVariantMarket = String(getArg('variant-market', 'true')).trim() !== 'false';
const warmMarkets = String(getArg('markets', 'true')).trim() !== 'false';

console.log(
  [
    'Warming mint caches',
    'backend=cloudrun',
    `mints=${mints.length}`,
    `variantMarket=${warmVariantMarket}`,
    `markets=${warmMarkets}`,
  ].join(' | '),
);

const args = {
  mints,
  variantMarket: warmVariantMarket,
  markets: warmMarkets,
  // Aggressive when you just added/changed registry data.
  minAgeMs: 0,
};

const result = await callCloudRun('assets', 'mutation', 'cacheWarmRequestMintsWarm', args);

console.log(
  [
    'Scheduled',
    `totalMints=${result.totalMints}`,
    `scheduled=${result.scheduled.join(',') || '(none)'}`,
    `skipped=${result.skipped.join(',') || '(none)'}`,
  ].join(' | '),
);

