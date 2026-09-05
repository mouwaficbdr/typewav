import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultsPageClient } from '../ResultsPageClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ locale: 'fr' }),
}));

const mockGetPersonalRecords = vi.fn();
vi.mock('@/lib/db', () => ({
  getPersonalRecords: () => mockGetPersonalRecords(),
}));

// Mock ResultsPage pour inspecter les props reçues
vi.mock('@/components/typing/ResultsPage', () => ({
  ResultsPage: vi.fn(
    ({
      wpm,
      wpmNet,
      isNewWpmRecord,
    }: {
      wpm: number;
      wpmNet: number;
      isNewWpmRecord?: boolean;
      [key: string]: unknown;
    }) => (
      <div>
        <span data-testid="wpm">{wpm}</span>
        <span data-testid="wpmNet">{wpmNet}</span>
        <span data-testid="isNewWpmRecord">{String(isNewWpmRecord)}</span>
      </div>
    ),
  ),
}));

import { useSearchParams } from 'next/navigation';

describe('ResultsPageClient', () => {
  beforeEach(() => {
    mockGetPersonalRecords.mockReset().mockResolvedValue(null);
  });

  it('lit wpmNet depuis searchParams et le passe indépendamment de wpm', () => {
    const params = new URLSearchParams({
      wpm: '60',
      wpmNet: '45',
      accuracy: '90',
      consistency: '80',
      recommendation: 'great',
    });

    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<ResultsPageClient />);

    expect(screen.getByTestId('wpm').textContent).toBe('60');
    expect(screen.getByTestId('wpmNet').textContent).toBe('45');
  });

  it('utilise 0 comme fallback si wpmNet est absent des params', () => {
    const params = new URLSearchParams({
      wpm: '60',
      accuracy: '90',
      consistency: '80',
    });

    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<ResultsPageClient />);

    expect(screen.getByTestId('wpm').textContent).toBe('60');
    expect(screen.getByTestId('wpmNet').textContent).toBe('0');
  });

  it('wpmNet est différent de wpm quand des erreurs ont été commises', () => {
    const params = new URLSearchParams({
      wpm: '70',
      wpmNet: '50',
      accuracy: '80',
      consistency: '75',
    });

    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<ResultsPageClient />);

    const wpm = Number(screen.getByTestId('wpm').textContent);
    const wpmNet = Number(screen.getByTestId('wpmNet').textContent);

    expect(wpmNet).toBeLessThan(wpm);
  });

  it('calcule isNewWpmRecord à partir de wpmNet, pas du wpm brut', async () => {
    // wpm brut (70) dépasse le record stocké (65), mais wpmNet (60) non :
    // pas un nouveau record, puisque wpmNet est le chiffre réellement affiché
    // et celui que suivent les records personnels (voir progression.ts).
    mockGetPersonalRecords.mockResolvedValue({
      maxWpm: { value: 65, sessionId: 's1', achievedAt: 0 },
      maxAccuracy: { value: 0, sessionId: '', achievedAt: 0 },
      maxConsistency: { value: 0, sessionId: '', achievedAt: 0 },
      longestSession: { duration: 0, sessionId: '', achievedAt: 0 },
      byCollection: {},
    });
    const params = new URLSearchParams({
      wpm: '70',
      wpmNet: '60',
      accuracy: '90',
      consistency: '80',
    });
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    await act(async () => {
      render(<ResultsPageClient />);
      await Promise.resolve();
    });

    expect(screen.getByTestId('isNewWpmRecord').textContent).toBe('false');
  });

  it('détecte un nouveau record quand wpmNet dépasse le record stocké', async () => {
    mockGetPersonalRecords.mockResolvedValue({
      maxWpm: { value: 65, sessionId: 's1', achievedAt: 0 },
      maxAccuracy: { value: 0, sessionId: '', achievedAt: 0 },
      maxConsistency: { value: 0, sessionId: '', achievedAt: 0 },
      longestSession: { duration: 0, sessionId: '', achievedAt: 0 },
      byCollection: {},
    });
    const params = new URLSearchParams({
      wpm: '70',
      wpmNet: '80',
      accuracy: '90',
      consistency: '80',
    });
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    await act(async () => {
      render(<ResultsPageClient />);
      await Promise.resolve();
    });

    expect(screen.getByTestId('isNewWpmRecord').textContent).toBe('true');
  });
});
