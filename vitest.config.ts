import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
    projects: [
      {
        // Tests unitaires — packages/
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/**/src/__tests__/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // Tests lib apps/web (stats, db) — node avec fake-indexeddb
        extends: true,
        test: {
          name: 'web-lib',
          include: ['apps/web/lib/__tests__/**/*.test.ts'],
          environment: 'node',
          setupFiles: [],
        },
      },
      {
        // Tests hooks et composants apps/web — jsdom
        extends: true,
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'apps/web'),
            react: path.resolve(__dirname, 'apps/web/node_modules/react'),
            'react-dom': path.resolve(__dirname, 'apps/web/node_modules/react-dom'),
            'react/jsx-runtime': path.resolve(
              __dirname,
              'apps/web/node_modules/react/jsx-runtime',
            ),
            'react/jsx-dev-runtime': path.resolve(
              __dirname,
              'apps/web/node_modules/react/jsx-dev-runtime',
            ),
          },
        },
        test: {
          name: 'web-components',
          include: [
            'apps/web/hooks/__tests__/**/*.test.{ts,tsx}',
            'apps/web/components/__tests__/**/*.test.{ts,tsx}',
            'apps/web/app/**/__tests__/**/*.test.{ts,tsx}',
          ],
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
