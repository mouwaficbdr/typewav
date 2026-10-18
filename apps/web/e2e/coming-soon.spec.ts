import { expect, test } from '@playwright/test';
import { expectNoOverlap } from './helpers';

/**
 * Page « à venir » du Conservatoire (`/fr/conservatoire`) : kicker, titre,
 * liste des promesses, avant-goût jouable et action unique ne doivent jamais
 * se recouvrir, à aucune des trois tailles cibles, et rester entièrement
 * visibles sans défilement.
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
  // du sampler. Délai généreux plutôt qu'un flake sur ce seul premier appui.
  await expect(teaser).toHaveAttribute('data-ripple-count', '1', {
    timeout: 15_000,
  });

  await page.keyboard.press('KeyZ');
  await expect(teaser).toHaveAttribute('data-ripple-count', '1');
});

test("Entrée mène à l'accueil", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  await page.goto('/fr/conservatoire');

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/fr\/?$/);
});
