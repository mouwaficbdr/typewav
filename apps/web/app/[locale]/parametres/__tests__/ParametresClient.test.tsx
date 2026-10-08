import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NON_DESKTOP_MEDIA_QUERY } from '@/lib/device';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUserProfile = vi.fn();
const mockGetPreference = vi.fn().mockResolvedValue(undefined);
const mockSetPreference = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/db', () => ({
  getUserProfile: () => mockGetUserProfile(),
  exportAll: vi.fn(),
  importAll: vi.fn(),
  getPreference: (key: string) => mockGetPreference(key),
  setPreference: (key: string, value: unknown) =>
    mockSetPreference(key, value),
}));

const mockSetTheme = vi.fn();
vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({ themeId: 'terminal', setTheme: mockSetTheme }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/fr/parametres',
  useRouter: () => ({ push: mockPush }),
}));

const mockSetMode = vi.fn();
vi.mock('@/stores/useConfigStore', () => ({
  useConfigStore: () => ({ setMode: mockSetMode }),
}));

const mockResetLearningFingerIntroSeen = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/onboarding', () => ({
  resetLearningFingerIntroSeen: () => mockResetLearningFingerIntroSeen(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      // props spécifiques à motion : ne pas les laisser fuir sur le <div> DOM
      layoutId: _layoutId,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      exit: _exit,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  CheckCircle2: () => null,
  Palette: () => null,
  Languages: () => null,
  Keyboard: () => null,
  HardDrive: () => null,
  Download: () => null,
  Upload: () => null,
}));

import { APP_THEMES } from '@/lib/theme/defaultThemes';
import { ParametresClient } from '../ParametresClient';

// Libellés visibles des boutons de thème : la refonte les rend en minuscules
// (choix produit). Tous les thèmes sont débloqués d'office : plus aucun n'est
// derrière un déblocage conditionnel.
const HISTORIC_NAMES = [
  'dark terminal',
  'deep burgundy',
  'cyprus sand',
  'night imperial',
];
const FORMERLY_GATED_NAMES = ['noir', 'arcade', 'soleil de minuit'];

beforeEach(() => {
  mockGetUserProfile.mockReset();
  mockGetPreference.mockReset().mockResolvedValue(undefined);
  mockSetPreference.mockReset().mockResolvedValue(undefined);
});

describe('ParametresClient : sélecteur de thème', () => {
  it('propose tous les thèmes d’APP_THEMES, sans dépendre du profil', () => {
    render(<ParametresClient />);

    const buttons = screen.getAllByRole('button', { name: 'selectTheme' });
    expect(buttons.length).toBe(Object.keys(APP_THEMES).length);
  });

  it('affiche les thèmes historiques et les anciens thèmes de jalon côte à côte', () => {
    render(<ParametresClient />);

    for (const name of [...HISTORIC_NAMES, ...FORMERLY_GATED_NAMES]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it('expose le thème actif à l’AT via aria-pressed (pas seulement la couleur)', () => {
    // Le store mocké renvoie themeId 'terminal' = « Dark Terminal ».
    render(<ParametresClient />);

    const active = screen.getByText('dark terminal').closest('button')!;
    expect(active).toHaveAttribute('aria-pressed', 'true');

    const inactive = screen.getByText('deep burgundy').closest('button')!;
    expect(inactive).toHaveAttribute('aria-pressed', 'false');
  });

  it('chaque bouton de thème porte un nom accessible explicite', () => {
    render(<ParametresClient />);

    // aria-label = t('selectTheme', { name }) ; le mock i18n renvoie la clé.
    const buttons = screen.getAllByRole('button', { name: 'selectTheme' });
    expect(buttons.length).toBe(Object.keys(APP_THEMES).length);
  });
});

describe('ParametresClient : structure', () => {
  it('a un titre de page de niveau 1', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'title' }),
    ).toBeInTheDocument();
  });

  it('n’ajoute pas de landmark de navigation en double', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    // Le fil d'ariane est décoratif, pas un <nav> : ParametresClient ne doit
    // pas monter de landmark navigation (GlobalNav est rendu par le layout).
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('ParametresClient : gestion des données', () => {
  it('rend la section export / import (DataManagement)', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    expect(screen.getByText('dataOnDevice')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'dataExport' })).toBeTruthy();
  });
});

describe('ParametresClient : langue d’affichage (ticket #60)', () => {
  it('propose un lien vers chaque locale, avec la locale courante marquée', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    // Deux liens portent le même aria-label ('selectLanguage', clé brute
    // via le mock i18n) : on retrouve chacun par son href localisé.
    const links = screen.getAllByRole('link', { name: 'selectLanguage' });
    expect(links).toHaveLength(2);
    const frLink = links.find((l) => l.getAttribute('href') === '/fr/parametres')!;
    const enLink = links.find((l) => l.getAttribute('href') === '/en/parametres')!;
    expect(frLink).toBeTruthy();
    expect(enLink).toBeTruthy();
    expect(frLink).toHaveAttribute('aria-current', 'page');
    expect(enLink).not.toHaveAttribute('aria-current');
  });

  it('le lien vers la locale active pointe vers la même page, pas la racine', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    const enLink = screen
      .getAllByRole('link', { name: 'selectLanguage' })
      .find((l) => l.getAttribute('href') === '/en/parametres');
    expect(enLink).toBeTruthy();
  });
});

describe('ParametresClient : disposition du clavier (ticket #60)', () => {
  it('affiche azerty comme disposition active par défaut', async () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    await waitFor(() => expect(mockGetPreference).toHaveBeenCalled());
    const buttons = screen.getAllByRole('button', { name: 'selectLayout' });
    expect(buttons).toHaveLength(2);
    // Le mock i18n renvoie la clé brute, pas le libellé traduit.
    const azerty = buttons.find((b) => b.textContent?.includes('layoutAzerty'))!;
    expect(azerty).toHaveAttribute('aria-pressed', 'true');
  });

  it('charge la disposition déjà stockée', async () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));
    mockGetPreference.mockResolvedValue('azerty');

    render(<ParametresClient />);

    await waitFor(() => {
      const azerty = screen
        .getAllByRole('button', { name: 'selectLayout' })
        .find((b) => b.textContent?.includes('layoutAzerty'))!;
      expect(azerty).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('cliquer sur une disposition la persiste', async () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<ParametresClient />);

    await waitFor(() => expect(mockGetPreference).toHaveBeenCalled());
    const azerty = screen
      .getAllByRole('button', { name: 'selectLayout' })
      .find((b) => b.textContent?.includes('layoutAzerty'))!;
    await user.click(azerty);

    await waitFor(() =>
      expect(mockSetPreference).toHaveBeenCalledWith('keyboardLayout', 'azerty'),
    );
    expect(azerty).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ParametresClient : revoir le positionnement des doigts (ticket #62)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetMode.mockClear();
    mockResetLearningFingerIntroSeen.mockClear().mockResolvedValue(undefined);
  });

  it('réinitialise l’écran de positionnement, bascule sur Apprentissage et navigue vers l’accueil', async () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<ParametresClient />);

    const reviewButton = await screen.findByRole('button', {
      name: 'reviewFingerPositioning',
    });
    await user.click(reviewButton);

    expect(mockResetLearningFingerIntroSeen).toHaveBeenCalledOnce();
    expect(mockSetMode).toHaveBeenCalledWith('learning');
    expect(mockPush).toHaveBeenCalledWith('/fr');
  });
});

describe('ParametresClient : positionnement des doigts, desktop-only (#98)', () => {
  const realMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  function setMatchMedia(matches: (q: string) => boolean) {
    window.matchMedia = ((q: string) => ({
      matches: matches(q),
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  it("masque l'entrée « revoir le positionnement des doigts » sur appareil non desktop", async () => {
    setMatchMedia((q) => q === NON_DESKTOP_MEDIA_QUERY);
    render(<ParametresClient />);
    await waitFor(() =>
      expect(
        screen.queryByText('reviewFingerPositioning'),
      ).not.toBeInTheDocument(),
    );
  });

  it("affiche l'entrée sur desktop", async () => {
    setMatchMedia(() => false);
    render(<ParametresClient />);
    expect(
      await screen.findByText('reviewFingerPositioning'),
    ).toBeInTheDocument();
  });
});
