import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

import type { LeaderboardEntry } from '@typewav/types';
import { LeaderboardTable } from '../social/LeaderboardTable';

const mockEntry: LeaderboardEntry = {
  pseudo: 'alice',
  wpm: 80,
  accuracy: 95,
  mode: 'classic',
  achievedAt: Date.now(),
  collectionId: 'litterature',
  week: '2026-10',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LeaderboardTable — i18n', () => {
  it('état vide affiche t(leaderboard.noData)', () => {
    render(<LeaderboardTable entries={[]} />);
    // Mock retourne la clé : 'noData' (namespace 'leaderboard')
    expect(screen.getByText('noData')).toBeInTheDocument();
  });

  it('badge "vous" utilise t(leaderboard.you)', () => {
    render(
      <LeaderboardTable entries={[mockEntry]} currentUserPseudo="alice" />,
    );
    // Mock retourne la clé : 'you' (namespace 'leaderboard')
    expect(screen.getByText('you')).toBeInTheDocument();
  });

  it('les headers de colonnes utilisent les clés i18n', () => {
    render(<LeaderboardTable entries={[mockEntry]} />);
    expect(screen.getByText('rankHeader')).toBeInTheDocument();
    expect(screen.getByText('pseudoHeader')).toBeInTheDocument();
    expect(screen.getByText('wpmHeader')).toBeInTheDocument();
    expect(screen.getByText('accuracyHeader')).toBeInTheDocument();
    expect(screen.getByText('modeHeader')).toBeInTheDocument();
  });
});
