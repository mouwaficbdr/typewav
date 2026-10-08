import { defineConfig } from '@playwright/test';

/**
 * Tests de rendu (layout reel dans Chromium), sur le build de production :
 * `pnpm build` d'abord, puis `pnpm test:e2e`. Port dedie pour ne jamais
 * s'accrocher au serveur de dev sur :3000.
 */
const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/fr`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
