import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoOverlap } from './helpers';

/**
 * Onboarding du Conservatoire joue entierement au clavier : a chaque ecran,
 * aucune partie de Stage n'en recouvre une autre et toutes restent dans la
 * fenetre, aux deux tailles de portable visees.
 *
 * Contrairement aux autres specs e2e, le tout premier ecran declenche le vrai
 * moteur audio (chargement de l'instrument complet) : sous deux workers en
 * parallele, le delai par defaut de Playwright (5 s par assertion) est trop
 * court pour la transition qui suit. `TITLE_TIMEOUT` etend la fenetre de
 * l'assertion de titre ; c'est la meme assertion sur condition, juste une
 * fenetre realiste face a un chargement audio reel, pas une boucle d'attente
 * sur le temps.
 */
const TITLE_TIMEOUT = 15_000;

const VIEWPORTS = [
  { width: 1280, height: 650 },
  { width: 1024, height: 600 },
];
const SCALE = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];

async function expectScreen(page: Page, title: string): Promise<void> {
  const main = page.locator('main');
  await expect(main.locator('[data-part="title"]')).toHaveText(title, { timeout: TITLE_TIMEOUT });
  const parts: Record<string, Locator> = {};
  for (const [i, part] of (await main.locator('[data-part]').all()).entries()) {
    parts[`${(await part.getAttribute('data-part')) ?? 'part'} ${i}`] = part;
  }
  await expectNoOverlap(parts);
  for (const part of Object.values(parts)) {
    await expect(part).toBeInViewport({ ratio: 1 });
  }
}

for (const viewport of VIEWPORTS) {
  test(`onboarding au clavier a ${viewport.width}x${viewport.height} : chaque ecran lisible, rien ne se chevauche`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.goto('/fr');
    await page.waitForURL('**/fr/conservatoire');
    const main = page.locator('main');
    const keyboard = main.locator('[data-living-keyboard]');

    await expectScreen(page, 'Ton clavier est un instrument.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Pose ton index gauche sur F.');
    await expect(main.locator('[data-target]')).toHaveAttribute('data-code', 'KeyF');
    await page.keyboard.press('KeyF');
    await expect(keyboard).toHaveAttribute('data-ripple-count', '1');

    await expectScreen(page, 'Et ton index droit sur J.');
    await page.keyboard.press('KeyJ');

    await expectScreen(page, 'Pose les six autres doigts. Joue de gauche à droite.');
    for (const code of SCALE) await page.keyboard.press(code);
    await expectScreen(page, 'Tu viens de jouer ta première gamme.');
    // Chromium sous Playwright tape en QWERTY US : la disposition est detectee
    // et le clavier se reetiquette.
    await expect(keyboard.locator('[data-code="KeyQ"] text')).toHaveText('q');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Rejoue-la sans regarder tes mains.');
    await expect(main.locator('[data-target]')).toHaveCount(0);
    for (const code of SCALE) await page.keyboard.press(code);
    await expectScreen(page, 'Tes doigts connaissent déjà le chemin.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Appuie sur K.');
    await page.keyboard.press('KeyK');
    await expectScreen(page, 'Maintenant, appuie sur une autre touche.');
    await page.keyboard.press('KeyX');
    await expectScreen(page, 'Silence. Une erreur ne joue rien.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Tes progrès restent dans ce navigateur.');
    await page.keyboard.press('KeyI');
    await expect(main.getByText('La navigation privée ne garde rien.')).toBeVisible();
    await expectScreen(page, 'Tes progrès restent dans ce navigateur.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Tu tapes déjà un peu ?');
    await page.keyboard.press('Digit1');
    await expectScreen(page, 'Combien de minutes par jour ?');
    await page.keyboard.press('Digit2');
    await expectScreen(page, "Ta première leçon t'attend.");
    await page.keyboard.press('Space');

    // L'onboarding est fini pour de bon : l'espace s'ouvre, et un rechargement
    // ne le rejoue pas.
    await expect(main.locator('[data-part="title"]')).toHaveCount(0);
    await page.reload();
    await expect(page).toHaveURL(/\/fr\/conservatoire$/);
    await expect(main.locator('[data-part="title"]')).toHaveCount(0);
  });
}

test('mouvement reduit : aucun canvas, la frappe juste repond quand meme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/fr/conservatoire');
  const main = page.locator('main');
  await expect(main.locator('[data-part="title"]')).toHaveText('Ton clavier est un instrument.');
  await page.keyboard.press('Space');
  await expect(main.locator('[data-target]')).toHaveAttribute('data-code', 'KeyF');
  await expect(main.locator('canvas')).toHaveCount(0);
  await page.keyboard.press('KeyF');
  await expect(main.locator('[data-living-keyboard]')).toHaveAttribute('data-ripple-count', '1');
});
