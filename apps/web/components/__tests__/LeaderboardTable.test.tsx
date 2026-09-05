import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

// motion.* passthrough qui garde `initial`/`animate` visibles en attributs
// data- (au lieu de les avaler) : permet de vérifier que
// prefers-reduced-motion désarme réellement l'entrée chorégraphiée, pas
// seulement que le composant ne plante pas.
const mockUseReducedMotion = vi.fn(() => false);
vi.mock('motion/react', () => {
  const passthrough = (tag: string) => {
    const Cmp = ({
      children,
      initial,
      animate,
      variants: _variants,
      transition: _transition,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const El = tag as keyof React.JSX.IntrinsicElements;
      return (
        <El
          {...(rest as object)}
          data-motion-initial={String(initial)}
          data-motion-animate={String(animate)}
        >
          {children}
        </El>
      );
    };
    Cmp.displayName = `motion.${tag}`;
    return Cmp;
  };
  return {
    motion: new Proxy({}, { get: (_t, p: string) => passthrough(p) }),
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

import type { LeaderboardEntry } from '@typewav/types';
import { LeaderboardTable } from '../social/LeaderboardTable';

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    pseudo: '',
    wpm: 80,
    accuracy: 95,
    mode: 'classic',
    achievedAt: Date.now(),
    collectionId: 'litterature',
    week: '2026-10',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LeaderboardTable : i18n', () => {
  it('état vide affiche t(leaderboard.noData)', () => {
    render(<LeaderboardTable entries={[]} />);
    // Mock retourne la clé : 'noData' (namespace 'leaderboard')
    expect(screen.getByText('noData')).toBeInTheDocument();
  });

  it('les headers de colonnes utilisent les clés i18n, sans pseudo', () => {
    render(<LeaderboardTable entries={[makeEntry()]} />);
    // Pas de libellé "rankHeader" séparé : le rang est le grand chiffre
    // lui-même (01, 02...), auto-porteur, aucune clé i18n ne le décrit.
    // { exact: false } : ces libellés partagent leur span avec un ":" ou un
    // "//" littéral juxtaposé, le textContent du nœud n'est donc pas la clé
    // seule.
    expect(screen.getByText('wpmHeader')).toBeInTheDocument();
    expect(screen.getByText('accuracyHeader', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('modeHeader', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('levelHeader', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('pseudoHeader')).not.toBeInTheDocument();
  });

  it("chaque ligne affiche le palier de tempo de sa propre performance", () => {
    render(
      <LeaderboardTable
        entries={[
          makeEntry({ wpm: 20, achievedAt: 1 }),
          makeEntry({ wpm: 95, achievedAt: 2 }),
        ]}
      />,
    );
    // Mock next-intl : t('ranks.novice') via useTranslations('ranks') renvoie la clé.
    expect(screen.getByText('novice')).toBeInTheDocument();
    expect(screen.getByText('ghost')).toBeInTheDocument();
  });

  it("ne porte plus aucune notion de « vous » : v1 n'a qu'un seul joueur", () => {
    render(<LeaderboardTable entries={[makeEntry()]} />);
    expect(screen.queryByText('you')).not.toBeInTheDocument();
  });

  it('respecte prefers-reduced-motion : entrée désarmée sur la liste', () => {
    mockUseReducedMotion.mockReturnValue(true);
    render(<LeaderboardTable entries={[makeEntry()]} />);
    expect(screen.getByRole('list')).toHaveAttribute(
      'data-motion-animate',
      'false',
    );
    mockUseReducedMotion.mockReturnValue(false);
  });

  it('le rang au-delà du podium reste sur un token de contraste sûr (pas de fondu inline)', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ wpm: 100 - i, achievedAt: i }),
    );
    render(<LeaderboardTable entries={entries} />);
    const fifth = screen.getByText('05');
    // Aucune couleur inline : la teinte vient d'une classe Tailwind sur un
    // token éprouvé (--color-text-muted), jamais d'un color-mix vers
    // transparent qui ferait chuter le contraste sous 3:1.
    expect(fifth).not.toHaveAttribute('style');
    expect(fifth.className).toContain('text-[var(--color-text-muted)]');
  });
});
