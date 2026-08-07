import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Shared flat config for Next.js apps.
 *
 * Usage (eslint.config.mjs):
 *   import { nextConfig } from '@tokens/eslint-config/next';
 *   export default nextConfig;
 *
 * Append app-specific ignores as an extra `{ ignores: [...] }` entry.
 */
export const nextConfig = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**'],
    },
];

export default nextConfig;
