import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Capture des props reçues par TypingArea
let capturedOnComplete: ((wpm: number) => void) | undefined;
let capturedAutoNavigate: boolean | undefined;

vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: vi.fn(
    ({
      onComplete,
      autoNavigate,
    }: {
      onComplete?: (wpm: number) => void;
      autoNavigate?: boolean;
    }) => {
      capturedOnComplete = onComplete;
      capturedAutoNavigate = autoNavigate;
      return <div data-testid="typing-area" />;
    },
  ),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams('c=encoded-challenge')),
}));

vi.mock('@/lib/challenge', () => ({
  decodeChallenge: vi.fn(() => ({
    textId: 'test-text-1',
    mode: 'classic',
    duration: 60,
    creatorWpm: 80,
    textHash: 'hash-abc',
  })),
  getChallengeText: vi.fn(() => 'The quick brown fox'),
  hashText: vi.fn(() => 'hash-abc'),
  generateChallengeLink: vi.fn(() => '/challenge?c=counter'),
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

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`;
    return key;
  },
}));

import { decodeChallenge } from '@/lib/challenge';
import { ChallengeClient } from '../ChallengeClient';

const decodeChallengeMock = vi.mocked(decodeChallenge);

describe('ChallengeClient', () => {
  it('passe autoNavigate={false} à TypingArea', () => {
    render(<ChallengeClient />);
    expect(capturedAutoNavigate).toBe(false);
  });

  it('lien illisible : atterrissage calme (titre + CTA produit), jamais une ligne rouge', () => {
    decodeChallengeMock.mockImplementationOnce(() => {
      throw new Error('bad payload');
    });

    render(<ChallengeClient />);

    expect(
      screen.getByRole('heading', { name: 'linkErrorTitle' }),
    ).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: 'tryTypewav' });
    expect(cta).toHaveAttribute('href', '/fr');
    // La cause reste affichée, mais plus de bouton "retour" en pied de page.
    expect(screen.getByText('invalidOrExpiredLink')).toBeInTheDocument();
    expect(screen.queryByText('backHome')).not.toBeInTheDocument();
  });

  it('affiche le résultat post-complétion après onComplete sans redirection', async () => {
    render(<ChallengeClient />);

    // Déclencher la fin de session via le callback onComplete
    await act(async () => {
      capturedOnComplete?.(85);
    });

    // L'écran post-complétion doit être visible
    expect(screen.getByText(/wonWithWpm/)).toBeInTheDocument();
    // Le bouton "Contre-défier" doit être accessible
    expect(screen.getByText('counterChallenge')).toBeInTheDocument();
  });
});
