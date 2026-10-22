import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoOverlap, readPreference } from './helpers';

/**
 * L'Ouverture (spec partie B) : le rideau joué à la première visite de
 * l'accueil. Le drapeau `has_seen_intro_v1` n'est volontairement JAMAIS posé
 * avant ces tests (contrairement aux autres specs, voir `skipIntro`) : c'est
 * justement ce qu'on veut voir apparaître.
 *
 * Plusieurs tests démarrent un vrai moteur audio (Tone.js) : la suite e2e
 * tourne sans parallélisme (`workers: 1`, voir playwright.config.ts) pour
 * ne jamais faire cohabiter deux contextes Web Audio réels.
 */

const DESKTOP_VIEWPORTS = [
  { width: 1280, height: 650 },
  { width: 1024, height: 600 },
];

async function regionScreen(page: Page): Promise<string | null> {
  return page.getByRole('region', { name: 'Ouverture' }).getAttribute('data-intro-screen');
}

async function waitForScreen(page: Page, n: number, timeout?: number): Promise<void> {
  await expect(page.getByRole('region', { name: 'Ouverture' })).toHaveAttribute(
    'data-intro-screen',
    String(n),
    { ...(timeout !== undefined ? { timeout } : {}) },
  );
}

/**
 * Vérifie l'absence de chevauchement entre le contenu de l'écran, la portée
 * et les indications de chrome (« passer », « continuer »), et que chacun
 * reste entièrement visible. Les parties absentes (écran 2 masque la portée
 * et l'indication « continuer » génériques, voir `Ouverture.tsx`) sont
 * simplement ignorées.
 */
async function expectScreenNoOverlap(
  page: Page,
  content: Locator,
): Promise<void> {
  const parts: Record<string, Locator> = { content };
  const candidates: Record<string, Locator> = {
    skip: page.locator('[data-part="chrome-skip"]'),
    continue: page.locator('[data-part="chrome-continue"]'),
    progress: page.locator('[data-part="chrome-progress"]'),
    staff: page.locator('[data-part="staff"]'),
  };
  for (const [name, locator] of Object.entries(candidates)) {
    if (await locator.count()) parts[name] = locator;
  }
  for (const locator of Object.values(parts)) {
    await expect(locator).toBeInViewport({ ratio: 1 });
  }
  await expectNoOverlap(parts, 5000);
}

/**
 * Attend le piano sur condition (disparition de « le piano s'accorde… »),
 * jamais sur un délai fixe : le tout premier `Tone.start()` d'une session
 * reste lent à se régler (voir useAudioEngine.ts, TONE_START_TIMEOUTS_MS).
 */
async function waitForPiano(page: Page): Promise<void> {
  await expect(page.getByText(/piano s'accorde/)).not.toBeVisible({
    timeout: 15_000,
  });
}

/** Écran 2 : tape « les notes », rate une touche, reprend, continue. */
async function clearPlayScreen(page: Page): Promise<void> {
  await expect(page.locator('[data-part="play-screen"]')).toHaveAttribute(
    'data-play-phase',
    'typing',
  );
  await page.keyboard.type('les notes');
  await expect(page.locator('[data-part="play-screen"]')).toHaveAttribute(
    'data-play-phase',
    'askMiss',
    { timeout: 10_000 },
  );
  // 9 frappes mais 10 têtes : le dernier caractère de « les notes » joue un
  // accord de 2 notes (A4+A2, basse réelle de la Lettre à Élise), pas une
  // seule (voir INTRO_MELODY dans intro-music.ts).
  await expect(page.locator('[data-part="staff"]')).toHaveAttribute(
    'data-note-heads',
    '10',
  );
  await page.keyboard.press('KeyZ');
  await expect(page.locator('[data-part="play-screen"]')).toHaveAttribute(
    'data-play-phase',
    'waiting',
  );
  // L'action à mener (retour arrière) est un élément distinct et visible,
  // pas noyée dans la phrase d'explication (retour Mouwafic 2026-10-22 :
  // « comment on passe à la suite »).
  await expect(page.locator('[data-part="play-resume-action"]')).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(page.locator('[data-part="play-screen"]')).toHaveAttribute(
    'data-play-phase',
    'resumed',
  );
  await page.keyboard.press('Space');
}

for (const viewport of DESKTOP_VIEWPORTS) {
  test(`au clavier à ${viewport.width}x${viewport.height} : parcours complet, rien ne se chevauche`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/fr');

    // Écran 1 : la langue.
    await expectScreenNoOverlap(
      page,
      page.locator('[data-part="language-screen"]'),
    );
    await page.keyboard.press('KeyF');
    await waitForPiano(page);
    // Comme waitForPiano : le tout premier Tone.start() peut rester lent,
    // surtout sous charge (plusieurs suites e2e en parallèle).
    await waitForScreen(page, 2, 15_000);

    // Écran 2 : joue.
    await expectScreenNoOverlap(page, page.locator('[data-part="play-screen"]'));
    await clearPlayScreen(page);
    await waitForScreen(page, 3);

    // Écrans 3 à 5.
    const screenParts = [
      '[data-part="why-screen"]',
      '[data-part="features-screen"]',
      '[data-part="data-screen"]',
    ];
    for (const [i, selector] of screenParts.entries()) {
      await expectScreenNoOverlap(page, page.locator(selector));
      await page.keyboard.press('Space');
      await waitForScreen(page, 4 + i);
    }

    // Écran 6 : à toi.
    await expectScreenNoOverlap(page, page.locator('[data-part="start-screen"]'));
    await page.keyboard.press('Space');

    // Le rideau se lève sur l'accueil : URL inchangée, focus sur la frappe.
    await expect(page).toHaveURL(/\/fr\/?$/);
    await expect(page.getByTestId('typing-capture')).toBeFocused();

    // Un rechargement ne remontre pas l'Ouverture.
    await page.reload();
    await expect(
      page.getByRole('region', { name: 'Ouverture' }),
    ).toHaveCount(0);
  });
}

test("la langue : E à l'écran 1 puis Échap change l'URL et persiste textLanguage", async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP_VIEWPORTS[0]!);
  await page.goto('/fr');

  expect(await regionScreen(page)).toBe('1');
  await page.keyboard.press('KeyE');
  await page.keyboard.press('Escape');

  // Sous charge parallèle (autre suite e2e avec un vrai moteur audio sur le
  // même CPU), même une navigation client-side peut dépasser le délai par
  // défaut.
  await expect(page).toHaveURL(/\/en\/?$/, { timeout: 15_000 });
  // Idem pour l'écriture IndexedDB du store de config, asynchrone elle aussi.
  await expect
    .poll(
      async () => {
        const raw = await readPreference<string>(page, 'typewav-config');
        if (!raw) return undefined;
        return (JSON.parse(raw) as { state?: { textLanguage?: string } }).state
          ?.textLanguage;
      },
      { timeout: 15_000 },
    )
    .toBe('en');
});

test('rejouer depuis À propos pendant que le piano est déjà chaud ne saute pas l’écran 1', async ({
  page,
}) => {
  // Bug réel signalé par Mouwafic le 2026-10-22 : l'avance automatique de
  // l'écran 1 ne regardait que isSamplerLoaded, pas si une langue avait été
  // choisie CETTE FOIS-CI. Un piano déjà chaud (ici : laissé tel quel après
  // Échap, sans recharger la page) faisait sauter l'écran 1 au montage,
  // avant même de pouvoir lire quoi que ce soit.
  await page.setViewportSize(DESKTOP_VIEWPORTS[0]!);
  await page.goto('/fr');
  // Attendre que l'écran 1 soit effectivement là avant la première frappe :
  // juste après `goto`, le listener clavier peut ne pas encore être attaché,
  // et un `KeyF` trop précoce se perd silencieusement (vécu en vérifiant ce
  // correctif à la main).
  await expect(page.locator('[data-part="language-screen"]')).toBeVisible();
  await page.keyboard.press('KeyF');
  await waitForPiano(page);
  await waitForScreen(page, 2, 15_000);
  await page.keyboard.press('Escape'); // ferme sans recharger : le piano reste chaud

  await page.getByRole('link', { name: 'À propos' }).click();
  await page.getByRole('link', { name: "Revoir l'introduction" }).click();

  // Doit rester sur l'écran 1, pas sauter directement à l'écran 2 ou plus.
  await expect(page.getByRole('region', { name: 'Ouverture' })).toHaveAttribute(
    'data-intro-screen',
    '1',
  );
  await page.waitForTimeout(2000);
  expect(await regionScreen(page)).toBe('1');
});

test.describe('tactile', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("l'écran 2 avance au toucher, l'écran 6 montre les actions tactiles", async ({
    page,
  }) => {
    await page.goto('/fr');

    await expect(page.getByTestId('language-fr')).toBeVisible();
    await page.getByTestId('language-fr').tap();
    await waitForPiano(page);
    await waitForScreen(page, 2, 15_000);

    const surface = page.getByTestId('play-touch-surface');
    for (let i = 0; i < 10; i++) {
      await surface.tap();
      const phase = await regionScreen(page);
      if (phase === '3') break;
    }
    await waitForScreen(page, 3);

    for (let s = 3; s <= 5; s++) {
      await page.getByTestId('intro-continue-touch').tap();
      await waitForScreen(page, s + 1);
    }

    await expect(page.getByText("Envoie-toi le lien")).toBeVisible();
    await expect(page.getByText('Explorer quand même')).toBeVisible();
  });
});

test('mouvement réduit : le parcours se termine, aucun élément animé en translation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(DESKTOP_VIEWPORTS[0]!);
  await page.goto('/fr');
  // Comme pour le test de rejeu depuis À propos : attendre l'écran 1 avant
  // la première frappe, sans quoi `KeyF` peut arriver avant que le listener
  // clavier soit attaché et se perdre silencieusement.
  await expect(page.locator('[data-part="language-screen"]')).toBeVisible();

  await page.keyboard.press('KeyF');
  await waitForPiano(page);
  await waitForScreen(page, 2, 15_000);

  // Aucun élément de l'Ouverture ne doit porter de transform sous mouvement
  // réduit (vérifié en plein milieu du parcours, pendant que l'Ouverture
  // occupe l'écran : après la fermeture le rideau laisse place à l'accueil,
  // dont les transforms n'ont rien à voir avec l'Ouverture).
  // page.$$eval est l'API Playwright de requête DOM dans le contexte de la
  // page (pas eval() JS) : lecture read-only de styles calculés, test only.
  const transforms = await page.$$eval(
    '[role="region"] *',
    (els) =>
      els
        .map((el) => getComputedStyle(el).transform)
        .filter((t) => t && t !== 'none'),
  );
  expect(transforms).toEqual([]);

  await clearPlayScreen(page);
  for (let s = 3; s <= 5; s++) {
    await page.keyboard.press('Space');
    await waitForScreen(page, s + 1);
  }
  await page.keyboard.press('Space');

  await expect(page).toHaveURL(/\/fr\/?$/);
});
