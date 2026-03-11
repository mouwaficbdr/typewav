import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResultsPageClient } from '../ResultsPageClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ locale: 'fr' }),
}));

// Mock ResultsPage pour inspecter les props reçues
vi.mock('@/components/typing/ResultsPage', () => ({
  ResultsPage: vi.fn(
    ({
      wpm,
      wpmNet,
    }: {
      wpm: number;
      wpmNet: number;
      [key: string]: unknown;
    }) => (
      <div>
        <span data-testid="wpm">{wpm}</span>
        <span data-testid="wpmNet">{wpmNet}</span>
      </div>
    ),
  ),
}));

import { useSearchParams } from 'next/navigation';

describe('ResultsPageClient', () => {
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
});
