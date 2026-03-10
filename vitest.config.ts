import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
    ],
  },
});
