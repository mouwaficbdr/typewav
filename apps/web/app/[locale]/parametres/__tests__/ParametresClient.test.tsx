import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUserProfile = vi.fn();
vi.mock('@/lib/db', () => ({
  getUserProfile: () => mockGetUserProfile(),
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
}));

import { ParametresClient } from '../ParametresClient';

// Noms visibles (h3) : base vs derrière un jalon.
const BASE_NAMES = [
  'Dark Terminal',
  'Deep Burgundy',
  'Cyprus Sand',
  'Night Imperial',
];
const GATED_NAMES = ['Noir', 'Arcade', 'Soleil de minuit'];

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

    expect(await screen.findByText('Noir')).toBeTruthy();
    expect(screen.queryByText('Arcade')).toBeNull();
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
});
