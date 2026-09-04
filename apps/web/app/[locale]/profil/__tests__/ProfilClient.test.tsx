import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { SessionResult } from '@typewav/types';

const mockSessions: SessionResult[] = Array.from({ length: 8 }, (_, i) => ({
  id: `session-${i}`,
  timestamp: Date.now() - i * 86_400_000,
  wpm: 60 + i,
  wpmNet: 58 + i,
  accuracy: 95,
  consistency: 80,
  duration: 60_000,
  mode: 'classic',
  themeId: 'terminal',
  collectionId: 'litterature',
  soundPackId: 'piano',
  keystrokeData: [],
}));

const dbMocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  getUserProfile: vi.fn(),
  getPersonalRecords: vi.fn(),
  getSessionById: vi.fn(),
  getPreference: vi.fn().mockResolvedValue(undefined),
  setPreference: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db', () => dbMocks);
vi.mock('@/lib/replay', () => ({ generateReplayLink: () => '/replay?d=x' }));

vi.mock('@/hooks/useEntranceAnimated', () => ({
  useEntranceAnimated: () => false,
}));

vi.mock('@/components/profile/ProfileSpotlight', () => ({
  ProfileSpotlight: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('@/components/ui/ScrambleText', () => ({
  ScrambleText: ({ text }: { text: string }) => <span>{text}</span>,
}));
vi.mock('@/components/ui/NumberTicker', () => ({
  NumberTicker: ({ value }: { value: number }) => <>{Math.round(value)}</>,
}));
vi.mock('@/components/profile/PracticeRoll', () => ({
  PracticeRoll: ({
    sessions,
    onReplaySession,
    emptyLabel,
  }: {
    sessions: readonly SessionResult[];
    onReplaySession: (id: string) => void;
    emptyLabel: string;
  }) =>
    sessions.length === 0 ? (
      <div>{emptyLabel}</div>
    ) : (
      <div data-testid="roll">
        {sessions.map((s) => (
          <button
            key={s.id}
            data-testid="roll-mark"
            onClick={() => onReplaySession(s.id)}
          >
            {s.id}
          </button>
        ))}
      </div>
    ),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/stores/useProgressionStore', () => ({
  useProgressionStore: () => ({
    setProfile: vi.fn(),
    setPersonalRecords: vi.fn(),
    setRank: vi.fn(),
  }),
}));
vi.mock('motion/react', () => {
  const make = (tag: string) => {
    const Cmp = ({ children, ...rest }: Record<string, unknown>) => {
      const El = tag as keyof React.JSX.IntrinsicElements;
      return <El {...(rest as object)}>{children as React.ReactNode}</El>;
    };
    Cmp.displayName = `motion.${tag}`;
    return Cmp;
  };
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }),
    useReducedMotion: () => false,
    animate: () => ({ stop: () => {} }),
  };
});

async function renderProfil() {
  dbMocks.getUserProfile.mockResolvedValue({
    currentRank: 'operator',
    pseudo: 'mouwafic',
  });
  dbMocks.getPersonalRecords.mockResolvedValue({
    maxWpm: { value: 92, sessionId: 'session-1', achievedAt: 0 },
    maxAccuracy: { value: 99, sessionId: 'session-2', achievedAt: 0 },
    maxConsistency: { value: 90, sessionId: 's', achievedAt: 0 },
    longestSession: { duration: 1, sessionId: 's', achievedAt: 0 },
    byCollection: {},
  });
  const { ProfilClient } = await import('../ProfilClient');
  return render(<ProfilClient />);
}

describe('ProfilClient — Le Rouleau', () => {
  it('affiche le rang, le WPM médian et le nombre de séances', async () => {
    dbMocks.getSessions.mockResolvedValue(mockSessions);
    await renderProfil();
    await waitFor(() => {
      // le rang apparaît dans le masthead ET dans l'échelle de rang
      expect(screen.getAllByText('operator').length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.getByText('medianWpm')).toBeInTheDocument();
    expect(screen.getByText('sessionCount')).toBeInTheDocument();
    expect(screen.getByText('personalRecords')).toBeInTheDocument();
  });

  it('le rouleau reçoit toutes les séances et le clic sur une marque rejoue', async () => {
    dbMocks.getSessions.mockResolvedValue(mockSessions);
    dbMocks.getSessionById.mockResolvedValue({ ...mockSessions[0], text: 'hi' });
    await renderProfil();
    await waitFor(() =>
      expect(screen.getAllByTestId('roll-mark')).toHaveLength(8),
    );
    fireEvent.click(screen.getAllByTestId('roll-mark')[3]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/fr/replay?d=x'));
  });

  it('état vide (0 séance) : amorce affichée, pas de section records', async () => {
    dbMocks.getSessions.mockResolvedValue([]);
    await renderProfil();
    await waitFor(() =>
      expect(screen.getByText('emptyLead')).toBeInTheDocument(),
    );
    expect(screen.getByText('rollEmpty')).toBeInTheDocument();
    expect(screen.queryByText('personalRecords')).not.toBeInTheDocument();
    // l'échelle de rang reste présente
    expect(screen.getByText('rank')).toBeInTheDocument();
  });

  it('affiche le delta depuis la dernière visite quand il y a de nouvelles séances', async () => {
    dbMocks.getSessions.mockResolvedValue(mockSessions); // 8 séances
    dbMocks.getPreference.mockResolvedValue({ count: 5, wpm: 40 });
    await renderProfil();
    await waitFor(() => {
      expect(screen.getByText('sinceLastVisit')).toBeInTheDocument();
    });
    // snapshot réécrit
    expect(dbMocks.setPreference).toHaveBeenCalledWith(
      'typewav-profile-last-seen',
      expect.objectContaining({ count: 8 }),
    );
  });

  it('pas de delta si aucune nouvelle séance depuis la dernière visite', async () => {
    dbMocks.getSessions.mockResolvedValue(mockSessions); // 8
    dbMocks.getPreference.mockResolvedValue({ count: 8, wpm: 60 });
    await renderProfil();
    await waitFor(() =>
      expect(screen.getByText('personalRecords')).toBeInTheDocument(),
    );
    expect(screen.queryByText('sinceLastVisit')).not.toBeInTheDocument();
  });

  it('le footer pointe vers la gestion des données', async () => {
    dbMocks.getSessions.mockResolvedValue(mockSessions);
    await renderProfil();
    await waitFor(() => {
      const manage = screen.getByRole('link', { name: 'manageData' });
      expect(manage).toHaveAttribute('href', '/fr/parametres');
    });
  });
});
