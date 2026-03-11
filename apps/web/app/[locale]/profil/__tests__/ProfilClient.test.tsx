import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  getSessions: vi.fn().mockResolvedValue([]),
  getUserProfile: vi.fn().mockResolvedValue({ currentRank: 'novice' }),
  getPersonalRecords: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/stores/useProgressionStore', () => ({
  useProgressionStore: () => ({
    setProfile: vi.fn(),
    setPersonalRecords: vi.fn(),
    setRank: vi.fn(),
  }),
}));

const mockIsPremium = vi.fn<() => boolean>(() => false);

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ user: null, isPremium: mockIsPremium(), loading: false }),
}));

vi.mock('@/lib/featureFlags', () => ({
  SYNC_IS_COMING_SOON: true,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
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

vi.mock('@/components/charts/ContributionHeatmap', () => ({
  ContributionHeatmap: () => <div data-testid="heatmap" />,
}));

vi.mock('@/components/charts/WpmProgressChart', () => ({
  WpmProgressChart: () => <div data-testid="wpm-chart" />,
}));

vi.mock('@/components/progression/RankBadge', () => ({
  RankBadge: () => <div data-testid="rank-badge" />,
}));

const renderProfilClient = async () => {
  const { ProfilClient } = await import('../ProfilClient');
  return render(<ProfilClient />);
};

describe('ProfilClient — i18n daysFilter', () => {
  it("les boutons de filtre jours utilisent tProfile('daysFilter') et non '{n}j' hardcodé", async () => {
    mockIsPremium.mockReturnValue(false);
    await renderProfilClient();
    await waitFor(() => {
      // Le mock retourne la clé — 3 boutons (7, 30, 90 jours) doivent rendre 'daysFilter'
      const buttons = screen.getAllByText('daysFilter');
      expect(buttons).toHaveLength(3);
    });
  });
});

describe('ProfilClient — sync banner', () => {
  it("n'affiche pas de banner sync si utilisateur gratuit", async () => {
    mockIsPremium.mockReturnValue(false);
    await renderProfilClient();
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('affiche un banner info sync si utilisateur premium', async () => {
    mockIsPremium.mockReturnValue(true);
    const { unmount } = await renderProfilClient();
    await waitFor(() => {
      const banner = screen.getByRole('status');
      expect(banner).toBeInTheDocument();
      expect(banner.textContent).toBe('premiumBanner');
    });
    unmount();
  });
});
