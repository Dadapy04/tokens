import { registerGracefulShutdown, wrapFetchWithShutdownGuard } from '@tokens/cloudrun-shutdown';
import { getSql, makePostgresPricesRepo } from './db';
import { createApp } from './server';

const authToken = process.env.TOKENS_CLOUDRUN_AUTH_TOKEN?.trim();
if (!authToken) {
    console.error('TOKENS_CLOUDRUN_AUTH_TOKEN must be set');
    process.exit(1);
}

const port = Number(process.env.PORT) || 8080;
const sql = getSql();
const app = createApp({ repo: makePostgresPricesRepo(sql), authToken });

registerGracefulShutdown({ sql, serviceName: 'cloudrun-prices' });

export default { port, fetch: wrapFetchWithShutdownGuard(app.fetch) };
