import { proxyPlatformError, proxyPlatformGet } from '../_platform-proxy';

export async function GET(request: Request): Promise<Response> {
    try {
        return await proxyPlatformGet(request);
    } catch (error) {
        return proxyPlatformError(error);
    }
}
