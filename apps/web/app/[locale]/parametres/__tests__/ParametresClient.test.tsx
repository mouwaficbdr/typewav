import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUserProfile = vi.fn();
vi.mock('@/lib/db', () => ({
  getUserProfile: () => mockGetUserProfile(),
  exportAll: vi.fn(),
  importAll: vi.fn(),
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

vi.mock('next/navigation', () => ({
  usePathname: () => '/fr/parametres',
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

describe('ParametresClient : plus de choix de disposition du clavier (retrait du mode Apprentissage)', () => {
  it("les Paramètres n'offrent plus de choix de disposition du clavier", () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));

    render(<ParametresClient />);

    expect(screen.queryByText(/AZERTY|QWERTY/i)).toBeNull();
    expect(screen.getByText('languageTitle')).toBeInTheDocument();
  });
});
