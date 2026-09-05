import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { BASE_UNLOCKED_THEME_IDS } from '@/lib/theme/defaultThemes';
import { ParametresClient } from '../ParametresClient';

// Libellés visibles des boutons de thème : la refonte les rend en minuscules
// (choix produit). base vs derrière un jalon.
const BASE_NAMES = [
  'dark terminal',
  'deep burgundy',
  'cyprus sand',
  'night imperial',
];
const GATED_NAMES = ['noir', 'arcade', 'soleil de minuit'];

beforeEach(() => {
  mockGetUserProfile.mockReset();
  mockGetPreference.mockReset().mockResolvedValue(undefined);
  mockSetPreference.mockReset().mockResolvedValue(undefined);
});

describe('ParametresClient : sélecteur de thème', () => {
  it('n’affiche que les thèmes débloqués du profil', async () => {
    mockGetUserProfile.mockResolvedValue({
      unlockedThemes: [
        'terminal',
        'deep-burgundy',
        'cyprus-sand',
        'night-imperial',
      ],
    });

    render(<ParametresClient />);

    await waitFor(() => {
      for (const name of BASE_NAMES) {
        expect(screen.getByText(name)).toBeTruthy();
      }
    });
    for (const name of GATED_NAMES) {
      expect(screen.queryByText(name)).toBeNull();
    }
  });

  it('affiche un thème débloqué par un jalon', async () => {
    mockGetUserProfile.mockResolvedValue({
      unlockedThemes: [
        'terminal',
        'deep-burgundy',
        'cyprus-sand',
        'night-imperial',
        'noir',
      ],
    });

    render(<ParametresClient />);

    expect(await screen.findByText('noir')).toBeTruthy();
    expect(screen.queryByText('arcade')).toBeNull();
  });

  it('un profil ancien (unlockedThemes = ["terminal"]) garde les 4 thèmes de base', async () => {
    mockGetUserProfile.mockResolvedValue({ unlockedThemes: ['terminal'] });

    render(<ParametresClient />);

    await waitFor(() => {
      for (const name of BASE_NAMES) {
        expect(screen.getByText(name)).toBeTruthy();
      }
    });
    for (const name of GATED_NAMES) {
      expect(screen.queryByText(name)).toBeNull();
    }
  });

  it('avant le chargement du profil, montre les thèmes de base', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {})); // jamais résolue

    render(<ParametresClient />);

    for (const name of BASE_NAMES) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    for (const name of GATED_NAMES) {
      expect(screen.queryByText(name)).toBeNull();
    }
  });

  it('expose le thème actif à l’AT via aria-pressed (pas seulement la couleur)', () => {
    // Le store mocké renvoie themeId 'terminal' = « Dark Terminal ».
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    const active = screen.getByText('dark terminal').closest('button')!;
    expect(active).toHaveAttribute('aria-pressed', 'true');

    const inactive = screen.getByText('deep burgundy').closest('button')!;
    expect(inactive).toHaveAttribute('aria-pressed', 'false');
  });

  it('chaque bouton de thème porte un nom accessible explicite', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    // aria-label = t('selectTheme', { name }) ; le mock i18n renvoie la clé.
    // Profil jamais résolu : seuls les thèmes débloqués d'office sont rendus
    // (ticket #64 : 26 désormais, BASE_NAMES ne couvre que les 4 historiques).
    const buttons = screen.getAllByRole('button', { name: 'selectTheme' });
    expect(buttons.length).toBe(BASE_UNLOCKED_THEME_IDS.length);
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
  it('affiche qwerty comme disposition active par défaut', async () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    await waitFor(() => expect(mockGetPreference).toHaveBeenCalled());
    const buttons = screen.getAllByRole('button', { name: 'selectLayout' });
    expect(buttons).toHaveLength(2);
    // Le mock i18n renvoie la clé brute, pas le libellé traduit.
    const qwerty = buttons.find((b) => b.textContent?.includes('layoutQwerty'))!;
    expect(qwerty).toHaveAttribute('aria-pressed', 'true');
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
