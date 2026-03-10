import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.next/',
      '**/node_modules/',
      '**/.next/',
      '**/dist/',
      'dist/',
      'coverage/',
      '**/*.config.js',
      '**/*.ts',
      '**/*.tsx',
    ],
  },
];
