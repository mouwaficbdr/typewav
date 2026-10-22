import { defineConfig } from '@playwright/test';

/**
 * Tests de rendu (layout reel dans Chromium), sur le build de production :
 * `pnpm build` d'abord, puis `pnpm test:e2e`. Port dedie pour ne jamais
 * s'accrocher au serveur de dev sur :3000.
 */
const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  // Plusieurs tests démarrent un vrai moteur audio (Tone.js). En parallèle,
  // plusieurs contextes Web Audio réels se disputent le même CPU et un
  // `Tone.start()` peut ne jamais finir dans le délai (pas juste plus
  // lentement) : flake confirmé de façon répétée et reproductible en local
  // et en CI (issue #132). `workers: 1` l'élimine entièrement, et measuré
  // plus rapide en pratique que les tentatives parallèles qui échouent puis
  // réessaient.
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/fr`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
