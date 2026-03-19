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

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { ClassementClient } from '../ClassementClient';

describe('ClassementClient — structure spec-31', () => {
  it('affiche le banner honnête avec badge BIENTÔT', async () => {
    render(<ClassementClient />);
    await waitFor(() => {
      expect(screen.getByTestId('coming-soon-banner')).toBeInTheDocument();
      expect(screen.getByTestId('soon-badge')).toBeInTheDocument();
      // With mock (key) => key, t('soon') = 'soon'
      expect(screen.getByTestId('soon-badge').textContent).toBe('soon');
    });
  });

  it('titre section "myBestSessions" visible', async () => {
    render(<ClassementClient />);
    await waitFor(() => {
      // With mock (key) => key, t('myBestSessions') = 'myBestSessions'
      expect(screen.getByText('myBestSessions')).toBeInTheDocument();
    });
  });

  it('affiche le message de classement mondial à venir', async () => {
    render(<ClassementClient />);
    await waitFor(() => {
      // With mock (key) => key, t('comingSoonMessage') = 'comingSoonMessage'
      expect(screen.getByText('comingSoonMessage')).toBeInTheDocument();
    });
  });
});
