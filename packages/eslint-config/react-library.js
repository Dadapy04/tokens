import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Shared flat config for React library packages (e.g. @tokens/ui).
 *
 * Usage (eslint.config.mjs):
 *   import { reactLibraryConfig } from '@tokens/eslint-config/react-library';
 *   export default reactLibraryConfig;
 */
export const reactLibraryConfig = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
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
        },
    },
];

export default reactLibraryConfig;
