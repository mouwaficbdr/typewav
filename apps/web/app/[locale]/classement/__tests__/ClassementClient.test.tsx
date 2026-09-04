import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  getSessions: vi.fn().mockResolvedValue([]),
  getUserProfile: vi
    .fn()
    .mockResolvedValue({ currentRank: 'novice', pseudo: '' }),
}));

vi.mock('@/components/social/LeaderboardTable', () => ({
  LeaderboardTable: () => <div data-testid="leaderboard-table" />,
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: () => (key: string) => key,
}));

import { ClassementClient } from '../ClassementClient';

describe('ClassementClient : séances personnelles, sans promesse cloud', () => {
  it('titre + sous-titre honnêtes, aucun bandeau « bientôt »', async () => {
    render(<ClassementClient />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'myBestSessions' })).toBeInTheDocument();
    });
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    // Plus de bandeau « classement mondial disponible dès la sync cloud ».
    expect(screen.queryByText('comingSoonMessage')).not.toBeInTheDocument();
    expect(screen.queryByText('soon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('coming-soon-banner')).not.toBeInTheDocument();
  });

  it('les filtres de mode portent aria-pressed et pilotent la sélection', async () => {
    render(<ClassementClient />);
    const allBtn = await screen.findByRole('button', { name: 'filters.all' });
    expect(allBtn).toHaveAttribute('aria-pressed', 'true');
    const codeBtn = screen.getByRole('button', { name: 'filters.code' });
    expect(codeBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('rend le tableau une fois le chargement terminé', async () => {
    render(<ClassementClient />);
    await waitFor(() =>
      expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument(),
    );
  });
});
