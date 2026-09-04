import { render, screen, waitFor } from '@testing-library/react';
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
  HardDrive: () => null,
  Download: () => null,
  Upload: () => null,
}));

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
    const buttons = screen.getAllByRole('button', { name: 'selectTheme' });
    expect(buttons.length).toBe(BASE_NAMES.length);
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
