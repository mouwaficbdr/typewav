import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // apps/web is linted by its own eslint-config-next; everything below is
    // build output, deps, or data.
    ignores: [
      'node_modules/',
      '**/node_modules/',
      '.next/',
      '**/.next/',
      'dist/',
      '**/dist/',
      'coverage/',
      '**/*.config.js',
      'apps/web/**',
    ],
  },
  {
    // Root-level JS tooling (this config, postcss, etc.).
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
    },
  },
  {
    // Workspace package + tool TypeScript — previously linted by nothing.
    // Non-type-checked recommended set: fast, no tsconfig project service.
    files: ['packages/**/*.ts', 'tools/**/*.ts'],
    ignores: ['**/__tests__/**'],
    extends: [...tseslint.configs.recommended],
    rules: {
      // TypeScript's own compiler enforces symbol resolution; the ESLint
      // core rule produces false positives on ambient/DOM/Node globals.
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // CLI generators legitimately write to stdout as their primary output.
    files: ['tools/**/*.ts'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-console': 'off',
    },
  },
);
