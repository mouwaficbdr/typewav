import { act, fireEvent, render, screen } from '@testing-library/react';
import type { TypingMode } from '@typewav/types';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ user: null, isPremium: false }),
}));

vi.mock('@/components/typing/WpmChart', () => ({
  WpmChart: () => <div data-testid="wpm-chart" />,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => true,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockPlayNoteName = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    initialize: mockInitialize,
    playNoteName: mockPlayNoteName,
  }),
}));

import { ResultsPage } from '../typing/ResultsPage';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseProps = {
  wpm: 87,
  wpmNet: 82,
  accuracy: 96,
  consistency: 88,
  durationMs: 51000,
  mode: 'classic' as TypingMode,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResultsPage — stats primaires', () => {
  it('affiche les 3 valeurs numériques principales', () => {
    render(<ResultsPage {...baseProps} />);
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('96')).toBeInTheDocument();
  });

  it('StatPrimary : label précède la valeur dans le DOM', () => {
    render(<ResultsPage {...baseProps} />);
    const wpmLabel = screen.getByText('wpm');
    const wpmValue = screen.getByText('87');
    expect(wpmLabel.compareDocumentPosition(wpmValue)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});

describe('ResultsPage — record', () => {
  it('affiche le marqueur record si isNewWpmRecord=true', () => {
    render(<ResultsPage {...baseProps} isNewWpmRecord={true} />);
    expect(screen.getByRole('status', { name: /record/i })).toBeInTheDocument();
  });

  it("n'affiche pas de marqueur si isNewWpmRecord est false", () => {
    render(
      <ResultsPage
        {...baseProps}
        isNewWpmRecord={false}
        isNewAccuracyRecord={false}
      />,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('ResultsPage — barre d\u2019actions', () => {
  it('affiche les liens nextTest et repeatTest', () => {
    render(<ResultsPage {...baseProps} />);
    const links = screen.getAllByRole('link');
    const nextOrRepeat = links.filter(
      (l) =>
        l.getAttribute('aria-label') === 'nextTest' ||
        l.getAttribute('aria-label') === 'repeatTest',
    );
    expect(nextOrRepeat.length).toBeGreaterThanOrEqual(2);
  });

  it('rend sans crash avec noteEvents vides', () => {
    expect(() =>
      render(<ResultsPage {...baseProps} noteEvents={[]} />),
    ).not.toThrow();
  });
});

describe('ResultsPage : réécoute de la mélodie', () => {
  const noteEvents = [
    { noteName: 'C4', timestamp: 0, charIndex: 0, isError: false as const },
    { noteName: 'E4', timestamp: 120, charIndex: 1, isError: false as const },
    { noteName: 'G4', timestamp: 300, charIndex: 2, isError: false as const },
  ];

  it('le bouton ♪ initialise l’audio et rejoue chaque note', async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    mockPlayNoteName.mockResolvedValue(undefined);

    render(<ResultsPage {...baseProps} noteEvents={noteEvents} />);
    fireEvent.click(screen.getByRole('button', { name: 'relisten' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockPlayNoteName).toHaveBeenCalledWith('C4');
    expect(mockPlayNoteName).toHaveBeenCalledWith('E4');
    expect(mockPlayNoteName).toHaveBeenCalledWith('G4');

    vi.useRealTimers();
  });

  it('le bouton ♪ est désactivé sans noteEvents', () => {
    render(<ResultsPage {...baseProps} noteEvents={[]} />);
    expect(
      screen.getByRole('button', { name: 'relisten' }),
    ).toBeDisabled();
  });
});

describe('ResultsPage — CTA login', () => {
  it('affiche le lien connexion si utilisateur non connecté', () => {
    render(<ResultsPage {...baseProps} />);
    const loginLink = screen.getByRole('link', { name: /loginCta/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toContain('/auth/login');
  });
});
