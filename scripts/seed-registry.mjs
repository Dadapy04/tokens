import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

function getArg(name, fallback) {
  const flag = `--${name}`;
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
  throw new Error(
    'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
  );
}

const includeCuratedCollections = String(getArg('include-curated-collections', 'true')).trim() !== 'false';

console.log(['Seeding registry', 'backend=cloudrun'].join(' | '));

const result = await callCloudRun('assets', 'mutation', 'cacheWarmRequestRegistrySeed', {
  includeCuratedCollections,
});

console.log(['Scheduled', `includeCuratedCollections=${result.includeCuratedCollections}`].join(' | '));
