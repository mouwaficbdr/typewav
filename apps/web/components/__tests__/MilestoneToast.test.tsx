import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLocale = vi.fn(() => 'fr');
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale(),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { exit?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => true,
}));

const mockPendingMilestones: import('@typewav/types').Milestone[] = [];
vi.mock('@/stores/useProgressionStore', () => ({
  useProgressionStore: () => ({
    pendingMilestones: mockPendingMilestones,
    clearPendingMilestones: vi.fn(),
  }),
}));

import type { Milestone } from '@typewav/types';
import { MilestoneToast } from '../progression/MilestoneToast';

// Extraire SingleToast via un workaround : on teste en injectant via le store
const mockMilestone: Milestone = {
  id: 'test-1',
  condition: { type: 'sessions', value: 1 },
  reward: { type: 'soundpack', packId: 'piano' },
  labelFr: 'Test FR Label',
  labelEn: 'Test EN Label',
};

// Helper pour rendre directement SingleToast (exporté pour tests)
// Comme SingleToast n'est pas exporté, on test via MilestoneToast + store mock
function renderWithMilestone(locale: string) {
  mockLocale.mockReturnValue(locale);
  mockPendingMilestones.length = 0;
  mockPendingMilestones.push(mockMilestone);
  return render(<MilestoneToast />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MilestoneToast — i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche labelFr pour locale fr', () => {
    renderWithMilestone('fr');
    expect(screen.getByText('Test FR Label')).toBeInTheDocument();
    expect(screen.queryByText('Test EN Label')).not.toBeInTheDocument();
  });

  it('affiche labelEn pour locale en', () => {
    renderWithMilestone('en');
    expect(screen.getByText('Test EN Label')).toBeInTheDocument();
    expect(screen.queryByText('Test FR Label')).not.toBeInTheDocument();
  });

  it('le titre utilise la clé i18n progression.milestoneUnlocked', () => {
    renderWithMilestone('fr');
    // useTranslations mock retourne la clé : 'progression.milestoneUnlocked' → 'milestoneUnlocked'
    // (le namespace est 'progression', donc t('milestoneUnlocked'))
    expect(screen.getByText('milestoneUnlocked')).toBeInTheDocument();
  });

  it("ne rend qu'un seul toast si le même jalon apparaît deux fois dans pendingMilestones (deux runAfterSession concurrents, même profil pas encore sauvegardé, débloquent le même jalon)", () => {
    mockLocale.mockReturnValue('fr');
    mockPendingMilestones.length = 0;
    mockPendingMilestones.push(mockMilestone, { ...mockMilestone });

    render(<MilestoneToast />);

    expect(screen.getAllByText('Test FR Label')).toHaveLength(1);
  });
});
