import { expect, test } from '@playwright/test';
import { expectNoOverlap, skipIntro } from './helpers';

/**
 * Page « à venir » du Conservatoire (`/fr/conservatoire`) : kicker, titre,
 * liste des promesses, avant-goût jouable et action unique ne doivent jamais
 * se recouvrir, à aucune des trois tailles cibles, et rester entièrement
 * visibles sans défilement.
 *
 * Plusieurs tests d'ici démarrent un vrai moteur audio (Tone.js) : la suite
 * e2e tourne sans parallélisme (`workers: 1`, voir playwright.config.ts)
 * pour ne jamais faire cohabiter deux contextes Web Audio réels.
 */

const VIEWPORTS = [
  { width: 1280, height: 650 },
  { width: 1024, height: 600 },
  { width: 390, height: 844 },
];

for (const viewport of VIEWPORTS) {
  test(`à ${viewport.width}x${viewport.height} : rien ne se chevauche, tout est visible`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/fr/conservatoire');

    const main = page.locator('main');
    const parts = {
      kicker: page.getByTestId('coming-soon-kicker'),
      titre: main.getByRole('heading', { level: 1 }),
      liste: main.getByRole('list'),
      avantGout: page.locator('[data-ripple-count]'),
      action: main.getByRole('link'),
    };

    for (const locator of Object.values(parts)) {
      await expect(locator).toBeInViewport({ ratio: 1 });
    }
    await expectNoOverlap(parts);
  });
}

test('une touche de la rangée de repos fait avancer le ripple, une autre non', async ({
  page,
}) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  await page.goto('/fr/conservatoire');

  const teaser = page.locator('[data-ripple-count]');
  await expect(teaser).toHaveAttribute('data-ripple-count', '0');

  await page.keyboard.press('KeyF');
  // Le tout premier Tone.start() d'une session peut rester lent à se régler
  // (montée du périphérique de sortie au premier usage, voir useAudioEngine.ts
  // TONE_START_TIMEOUTS_MS) : jusqu'à 5s rien que pour ça, plus le chargement
  // du sampler, et davantage encore quand plusieurs suites e2e tournent en
  // parallèle (plusieurs moteurs audio réels se disputent le même CPU).
  // Délai généreux plutôt qu'un flake sur ce seul premier appui.
  await expect(teaser).toHaveAttribute('data-ripple-count', '1', {
    timeout: 25_000,
  });

  await page.keyboard.press('KeyZ');
  await expect(teaser).toHaveAttribute('data-ripple-count', '1');
});

test("Entrée mène à l'accueil", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  // /conservatoire ne touche jamais IndexedDB : un aller-retour par /fr fait
  // ouvrir le vrai schema (via hasSeenIntro -> db.ts) avant qu'on y ecrive
  // directement, sans quoi `user_preferences` n'existe pas encore. `goto`
  // se résout au chargement de la page, pas à la fin de cet effet async : il
  // faut attendre une preuve qu'il a bien tourné (l'Ouverture apparaît, le
  // drapeau n'étant pas encore posé) avant de naviguer, sans quoi l'ouverture
  // de la base peut être coupée en plein vol par le changement de page.
  await page.goto('/fr');
  await expect(page.getByRole('region', { name: 'Ouverture' })).toBeVisible();
  await page.goto('/fr/conservatoire');
  // Ce test atterrit sur /fr : sans le drapeau, l'Ouverture recouvrirait
  // l'accueil juste après la navigation (spec partie B).
  await skipIntro(page);

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/fr\/?$/);
});
