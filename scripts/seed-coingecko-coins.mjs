import { loadLocalEnv } from './_env.mjs';
import { callCloudRunJob, getJobsIdentityToken } from './_jobs.mjs';

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

await loadLocalEnv();

const batchSize = Math.min(Math.max(toInt(getArg('batch-size', '100'), 100), 25), 1000);

console.log(['Seeding CoinGecko coin list via Cloud Run job', `batchSize=${batchSize}`].join(' | '));

try {
    const token = getJobsIdentityToken();
    const result = await callCloudRunJob('sync-coingecko-coin-list', { batchSize }, { token });

    console.log(JSON.stringify(result, null, 2));
    console.log('\nCoinGecko coin list sync complete.');
    console.log(
        'If this failed with a COINGECKO_API_KEY error, set it on the cloudrun-assets service (Doppler / terraform env).',
    );
} catch (error) {
    process.exitCode = 1;
    console.error('\nFailed to run CoinGecko coin list sync.');
    console.error(error instanceof Error ? error.message : String(error));
}
