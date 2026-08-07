function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

async function verifyRoute(path: string, handler: (request: Request) => Response): Promise<void> {
    const response = handler(new Request(`http://localhost${path}`));
    assert(response.status === 200, `${path}: expected status 200, got ${response.status}`);
    assert(response.headers.get('Cache-Control') === 'no-store', `${path}: expected Cache-Control: no-store`);

    const requestId = response.headers.get('x-request-id');
    assert(typeof requestId === 'string' && requestId.length > 0, `${path}: missing x-request-id header`);

    const payload = (await response.json()) as unknown;
    assert(
        typeof payload === 'object' && payload !== null && 'ok' in payload && (payload as { ok?: unknown }).ok === true,
        `${path}: expected { ok: true } JSON body`,
    );
}

async function main(): Promise<void> {
    const [{ GET: apiHealth }, { GET: v1Health }] = await Promise.all([
        import('../apps/api/src/app/api/health/route'),
        import('../apps/api/src/app/api/v1/health/route'),
    ]);

    await verifyRoute('/api/health', apiHealth);
    await verifyRoute('/api/v1/health', v1Health);

    console.log('API health route smoke verification passed.');
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
