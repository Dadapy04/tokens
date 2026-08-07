import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        externalDir: true,
    },
    async rewrites() {
        return [
            // Public API contract is `/v1/...` (see docs). Internally this app
            // namespaces route handlers under `/api/v1/...`.
            { source: '/v1/:path*', destination: '/api/v1/:path*' },
        ];
    },
};

export default nextConfig;
