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
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`;
    return key;
  },
}));

import { ChallengeClient } from '../ChallengeClient';

describe('ChallengeClient', () => {
  it('passe autoNavigate={false} à TypingArea', () => {
    render(<ChallengeClient />);
    expect(capturedAutoNavigate).toBe(false);
  });

  it('affiche le résultat post-complétion après onComplete sans redirection', async () => {
    render(<ChallengeClient />);

    // Déclencher la fin de session via le callback onComplete
    await act(async () => {
      capturedOnComplete?.(85);
    });

    // L'écran post-complétion doit être visible
    expect(screen.getByText(/85 WPM/)).toBeInTheDocument();
    // Le bouton "Contre-défier" doit être accessible
    expect(screen.getByText('Contre-défier')).toBeInTheDocument();
  });
});
