import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Mode Apprentissage : sur les ecrans d'enseignement, aucun element ne doit en
 * recouvrir un autre et le bouton « Commencer » doit rester atteignable, meme
 * sur une fenetre peu haute (portable une fois la barre du navigateur retiree).
 */
const VIEWPORTS = [
  { width: 1280, height: 650 },
  { width: 1024, height: 600 },
];
// Niveau 1 (reperes), 2 (10 gestes) et 8 (touches mortes) : les trois mises en
// page les plus chargees.
const LEVELS = [1, 2, 8];
const CURRICULUM_VERSION = 1;
const LEVEL_COUNT = 11;

async function seedPreferences(
  page: Page,
  prefs: Record<string, unknown>,
): Promise<void> {
  await page.evaluate(async (entries) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('typewav');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('user_preferences', 'readwrite');
      for (const [key, value] of Object.entries(entries)) {
        tx.objectStore('user_preferences').put(value, key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, prefs);
}

/** Ouvre l'ecran d'enseignement du niveau `level` (progression amorcee). */
async function openTeachStep(page: Page, level: number): Promise<void> {
  await page.goto('/fr');
  await page.waitForLoadState('networkidle');
  await seedPreferences(page, {
    learning_curriculum_version: CURRICULUM_VERSION,
    learning_level_progress: Array.from({ length: LEVEL_COUNT }, (_, i) => ({
      levelId: i + 1,
      accuracy: 0,
      samples: 0,
      unlocked: i + 1 <= level,
    })),
    learning_taught_levels: Array.from({ length: level - 1 }, (_, i) => i + 1),
    learning_key_mastery: {},
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible();
}

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element sans boite : non rendu');
  return box;
}

function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

for (const viewport of VIEWPORTS) {
  for (const level of LEVELS) {
    test(`enseignement niveau ${level} a ${viewport.width}x${viewport.height} : rien ne se chevauche`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openTeachStep(page, level);

      const main = page.locator('main');
      const parts = {
        titre: main.getByRole('heading', { level: 2 }),
        consigne: main.locator('p').first(),
        schema: main.locator('svg[aria-label]'),
        progression: main.getByRole('status'),
        bouton: main.getByRole('button', { name: 'Commencer' }),
      };

      const boxes = new Map<string, Box>();
      for (const [name, locator] of Object.entries(parts)) {
        boxes.set(name, await boxOf(locator));
      }

      const names = [...boxes.keys()];
      for (let i = 0; i < names.length; i += 1) {
        for (let j = i + 1; j < names.length; j += 1) {
          const a = names[i]!;
          const b = names[j]!;
          expect(
            overlapArea(boxes.get(a)!, boxes.get(b)!),
            `${a} recouvre ${b}`,
          ).toBeLessThanOrEqual(1);
        }
      }

      // Le bouton reste visible sans defiler la page, et le schema garde une
      // taille lisible.
      await expect(parts.bouton).toBeInViewport({ ratio: 1 });
      expect(boxes.get('schema')!.height).toBeGreaterThanOrEqual(120);
    });
  }
}
