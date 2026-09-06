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
      wpmRaw,
      isNewWpmRecord,
    }: {
      wpm: number;
      wpmRaw: number;
      isNewWpmRecord?: boolean;
      [key: string]: unknown;
    }) => (
      <div>
        <span data-testid="wpm">{wpm}</span>
        <span data-testid="wpmRaw">{wpmRaw}</span>
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

  it('lit wpm (chiffre de tête) et wpmRaw depuis searchParams, indépendamment', () => {
    const params = new URLSearchParams({
      wpm: '60',
      wpmRaw: '72',
      accuracy: '90',
      consistency: '80',
      recommendation: 'great',
    });

    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<ResultsPageClient />);

    expect(screen.getByTestId('wpm').textContent).toBe('60');
    expect(screen.getByTestId('wpmRaw').textContent).toBe('72');
  });

  it('utilise 0 comme fallback si wpmRaw est absent des params', () => {
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
    expect(screen.getByTestId('wpmRaw').textContent).toBe('0');
  });

  it('le chiffre de tête peut être plus bas que le brut (mots fautés non pénalisés dans le brut)', () => {
    const params = new URLSearchParams({
      wpm: '50',
      wpmRaw: '70',
      accuracy: '80',
      consistency: '75',
    });

    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<ResultsPageClient />);

    const wpm = Number(screen.getByTestId('wpm').textContent);
    const wpmRaw = Number(screen.getByTestId('wpmRaw').textContent);

    expect(wpm).toBeLessThan(wpmRaw);
  });

  it('calcule isNewWpmRecord à partir du wpm de tête, pas du wpm brut', async () => {
    // wpm brut (70) dépasse le record stocké (65), mais le chiffre de tête
    // (60) non : pas un nouveau record, puisque c'est le chiffre de tête qui
    // est affiché et que suivent les records personnels (voir progression.ts).
    mockGetPersonalRecords.mockResolvedValue({
      maxWpm: { value: 65, sessionId: 's1', achievedAt: 0 },
      maxAccuracy: { value: 0, sessionId: '', achievedAt: 0 },
      maxConsistency: { value: 0, sessionId: '', achievedAt: 0 },
      longestSession: { duration: 0, sessionId: '', achievedAt: 0 },
      byCollection: {},
    });
    const params = new URLSearchParams({
      wpm: '60',
      wpmRaw: '70',
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

  it('détecte un nouveau record quand le wpm de tête dépasse le record stocké', async () => {
    mockGetPersonalRecords.mockResolvedValue({
      maxWpm: { value: 65, sessionId: 's1', achievedAt: 0 },
      maxAccuracy: { value: 0, sessionId: '', achievedAt: 0 },
      maxConsistency: { value: 0, sessionId: '', achievedAt: 0 },
      longestSession: { duration: 0, sessionId: '', achievedAt: 0 },
      byCollection: {},
    });
    const params = new URLSearchParams({
      wpm: '80',
      wpmRaw: '85',
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
