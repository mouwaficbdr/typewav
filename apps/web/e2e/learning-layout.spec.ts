import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoOverlap, seedPreferences } from './helpers';

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

/** Amorce la progression : niveaux 1..level debloques, 1..taughtUpTo enseignes. */
async function openLearning(page: Page, level: number, taughtUpTo: number): Promise<void> {
  // La première visite mène à l'onboarding du Conservatoire ; on le marque
  // fait pour ouvrir directement l'espace (mode Apprentissage en intérim).
  await page.goto('/fr/conservatoire');
  await page.waitForLoadState('networkidle');
  await seedPreferences(page, {
    has_completed_onboarding: true,
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
