import { nextConfig } from '@tokens/eslint-config/next';

export default [...nextConfig, { ignores: ['.source/**'] }];
