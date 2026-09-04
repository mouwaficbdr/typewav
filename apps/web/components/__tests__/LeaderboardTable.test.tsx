import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

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

describe('LeaderboardTable — i18n', () => {
  it('état vide affiche t(leaderboard.noData)', () => {
    render(<LeaderboardTable entries={[]} />);
    // Mock retourne la clé : 'noData' (namespace 'leaderboard')
    expect(screen.getByText('noData')).toBeInTheDocument();
  });

  it('les headers de colonnes utilisent les clés i18n, sans pseudo', () => {
    render(<LeaderboardTable entries={[makeEntry()]} />);
    expect(screen.getByText('rankHeader')).toBeInTheDocument();
    expect(screen.getByText('wpmHeader')).toBeInTheDocument();
    expect(screen.getByText('accuracyHeader')).toBeInTheDocument();
    expect(screen.getByText('modeHeader')).toBeInTheDocument();
    expect(screen.getByText('levelHeader')).toBeInTheDocument();
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
});
