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

/** Amorce la progression : niveaux 1..level debloques, 1..taughtUpTo enseignes. */
async function openLearning(
  page: Page,
  level: number,
  taughtUpTo: number,
): Promise<void> {
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
    learning_taught_levels: Array.from({ length: taughtUpTo }, (_, i) => i + 1),
    learning_key_mastery: {},
  });
  await page.reload();
}

/** Ouvre l'ecran d'enseignement du niveau `level`. */
async function openTeachStep(page: Page, level: number): Promise<void> {
  await openLearning(page, level, level - 1);
  await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible();
}

/** Ouvre la boucle d'entrainement du niveau `level` (deja enseigne). */
async function openDrill(page: Page, level: number): Promise<void> {
  await openLearning(page, level, level);
  await expect(page.getByTestId('drill-zone')).toBeVisible();
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

/** Echoue si deux des elements nommes se recouvrent de plus d'1 px2. */
async function expectNoOverlap(parts: Record<string, Locator>): Promise<Map<string, Box>> {
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
  return boxes;
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

      const boxes = await expectNoOverlap(parts);

      // Le bouton reste visible sans defiler la page, et le schema garde une
      // taille lisible.
      await expect(parts.bouton).toBeInViewport({ ratio: 1 });
      expect(boxes.get('schema')!.height).toBeGreaterThanOrEqual(120);
    });
  }
}

// Boucle d'entrainement : titre, progression, texte et schema ne se recouvrent
// pas. Le schema prend la hauteur qui reste ; sous 90 px il se masque (fenetre
// tres basse) plutot que de recouvrir le texte.
const DRILL_LEVELS = [2, 6, 8];

for (const viewport of VIEWPORTS) {
  for (const level of DRILL_LEVELS) {
    test(`entrainement niveau ${level} a ${viewport.width}x${viewport.height} : rien ne se chevauche`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openDrill(page, level);

      const section = page.locator('main section');
      const parts: Record<string, Locator> = {
        titre: section.getByRole('heading', { level: 2 }),
        progression: section.getByRole('progressbar'),
        // La vraie boite du texte (le wrapper peut s'effondrer en laissant le
        // texte deborder dessus).
        texte: section.getByRole('application'),
      };
      for (const [i, button] of (
        await section.getByRole('button').all()
      ).entries()) {
        parts[`bouton ${i + 1}`] = button;
      }
      const schema = section.locator('svg[aria-label]');
      if (await schema.isVisible()) {
        parts['schema'] = schema;
      }
      const boxes = await expectNoOverlap(parts);

      // A 1280x650 il reste de la place : le schema doit etre la, lisible.
      if (viewport.height >= 650) {
        expect(boxes.get('schema')?.height ?? 0).toBeGreaterThanOrEqual(90);
      }
    });
  }
}
