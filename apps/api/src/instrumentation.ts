/**
 * Next.js instrumentation hook — runs once when the server boots.
 * Validates required environment up front so misconfiguration fails at
 * startup instead of at request time.
 */
export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { loadEnv, assertCloudRunEnvOrThrow } = await import('@/lib/env');
        loadEnv();
        assertCloudRunEnvOrThrow();
    }
}
