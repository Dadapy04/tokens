import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

function getArg(name, fallback) {
  const flag = `--${name}`;
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function format(value) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
  throw new Error(
    'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
  );
}

const mint = String(getArg('mint', 'suifhC9gU1VbJAPYPTBkHJyyyStKGLLYPVDTmPoqbvA')).trim();
if (!mint) throw new Error('Missing --mint');

// Cloud Run endpoint names mirror the wrappers in apps/api/src/lib/cloudrun
// (assetVariantsGetByMint, getByAssetId, …). The second arg keeps the legacy
// Convex path for readability in the log output below.
const runQuery = (cloudrunName, _legacyName, args) => callCloudRun('assets', 'query', cloudrunName, args);

console.log(['Checking mint caches', 'backend=cloudrun', `mint=${mint}`].join(' | '));

const variant = await runQuery('assetVariantsGetByMint', 'assetVariants.getByMint', { mint, includeInactive: true });
console.log('\nassetVariants.getByMint:');
console.log(format(variant));

if (!variant) {
  console.log('\nStatus: mint not present in assetVariants yet.');
  console.log(
    'Next: run `node scripts/seed-curated-mint.mjs --mint <MINT>` (or `node scripts/seed-registry.mjs --include-curated-collections false` for a full pass) then retry.',
  );
  process.exit(0);
}

const asset = await runQuery('getByAssetId', 'assets.getByAssetId', {
  assetId: variant.assetId,
  includeInactive: true,
});
console.log('\nassets.getByAssetId:');
console.log(format(asset));

const variantMarketsRows = await runQuery('variantMarketsGetLatestByMints', 'variantMarkets.getLatestByMints', {
  mints: [mint],
});
const variantMarket = Array.isArray(variantMarketsRows) ? (variantMarketsRows[0]?.market ?? null) : null;
console.log('\nvariantMarkets.getLatestByMints:');
console.log(format(variantMarket));

const tokenMarkets = await runQuery('tokenMarketsGetLatestByMint', 'tokenMarkets.getLatestByMint', { mint });
console.log('\ntokenMarkets.getLatestByMint:');
console.log(format(tokenMarkets));

const tokenDoc = await runQuery('tokensGetByAddress', 'tokens.getByAddress', { address: mint });
console.log('\ntokens.getByAddress:');
console.log(format(tokenDoc));

const hasVariantMarket = Boolean(variantMarket && variantMarket.lastFetchedAt > 0);
const hasTokenMarkets = Boolean(tokenMarkets && tokenMarkets.lastFetchedAt > 0 && (tokenMarkets.total ?? 0) > 0);

console.log('\nSummary:');
console.log(
  [
    `assetId=${variant.assetId}`,
    `hasVariantMarket=${hasVariantMarket}`,
    `hasTokenMarkets=${hasTokenMarkets}`,
  ].join(' | '),
);
