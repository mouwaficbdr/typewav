import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KeystrokeEntry, SessionResult, TypingMode } from '@typewav/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('motion/react', () => {
  const mk = (tag: string) => {
    const C = ({
      children,
      initial: _i,
      animate: _a,
      transition: _t,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const El = tag as unknown as React.ElementType;
      return <El {...props}>{children}</El>;
    };
    C.displayName = `motion.${tag}`;
    return C;
  };
  return {
    motion: { div: mk('div'), p: mk('p'), span: mk('span'), rect: mk('rect') },
    useReducedMotion: () => true,
  };
});

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const fn = (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key;
    return fn;
  },
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

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/components/typing/SessionWaveform', () => ({
  SessionWaveform: () => <div data-testid="session-waveform" />,
}));

const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockPlayNoteName = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    initialize: mockInitialize,
    playNoteName: mockPlayNoteName,
  }),
}));

let mockSession: SessionResult | null = null;
vi.mock('@/lib/db', () => ({
  getSessionById: vi.fn(() => Promise.resolve(mockSession)),
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

function makeSession(overrides: Partial<SessionResult> = {}): SessionResult {
  const keystrokes: KeystrokeEntry[] = Array.from({ length: 30 }, (_, i) => ({
    char: 'a',
    timestamp: i * 150,
    correct: true,
    deltaMs: 150,
  }));
  return {
    id: 's1',
    timestamp: Date.now(),
    wpm: 87,
    wpmNet: 82,
    accuracy: 96,
    consistency: 88,
    duration: 51000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: keystrokes,
    text: 'the quick brown fox',
    ...overrides,
  };
}

const notes = [
  { noteName: 'C4', timestamp: 0, charIndex: 0, isError: false as const },
  { noteName: 'E4', timestamp: 120, charIndex: 1, isError: false as const },
  { noteName: 'G4', timestamp: 300, charIndex: 2, isError: false as const },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockInitialize.mockResolvedValue(undefined);
  mockPlayNoteName.mockResolvedValue(undefined);
  mockSession = null;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResultsPage : le chiffre héros', () => {
  it('affiche le wpm net, pas le wpm brut', () => {
    render(<ResultsPage {...baseProps} />);
    expect(screen.getByText('82')).toBeInTheDocument();
    // Le wpm brut (87) n'est plus un chiffre affiché.
    expect(screen.queryByText('87')).not.toBeInTheDocument();
  });

  it('affiche précision et régularité en satellites', () => {
    render(<ResultsPage {...baseProps} />);
    expect(screen.getByText('96')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
  });
});

describe('ResultsPage : record', () => {
  it('affiche un marqueur record accessible si isNewWpmRecord', () => {
    render(<ResultsPage {...baseProps} isNewWpmRecord />);
    expect(
      screen.getByRole('status', { name: 'newRecord' }),
    ).toBeInTheDocument();
    expect(screen.getByText('recordKicker')).toBeInTheDocument();
  });

  it('aucun marqueur record sinon', () => {
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

describe('ResultsPage : continuer', () => {
  it('ENCORE est un lien vers la racine locale', () => {
    render(<ResultsPage {...baseProps} />);
    const encore = screen.getByRole('link', { name: 'nextTest' });
    expect(encore).toHaveAttribute('href', '/fr');
    expect(encore.textContent).toContain('encore');
  });

  it('Entrée relance un test quand le focus est sur le corps', () => {
    render(<ResultsPage {...baseProps} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/fr');
  });

  it("Entrée ne relance rien quand le focus est sur une commande (elle gère Entrée)", () => {
    render(<ResultsPage {...baseProps} />);
    screen.getByRole('link', { name: 'nextTest' }).focus();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('ResultsPage : la mélodie', () => {
  it('le bouton relisten est désactivé sans notes', () => {
    render(<ResultsPage {...baseProps} noteEvents={[]} />);
    expect(screen.getByRole('button', { name: 'relisten' })).toBeDisabled();
  });

  it('relisten initialise l’audio et rejoue chaque note', async () => {
    vi.useFakeTimers();
    render(<ResultsPage {...baseProps} noteEvents={notes} />);
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

  it('rend sans crash avec noteEvents vides et sans sessionId', () => {
    expect(() =>
      render(<ResultsPage {...baseProps} noteEvents={[]} />),
    ).not.toThrow();
  });
});

describe('ResultsPage : le verdict variable', () => {
  it('affiche une phrase de verdict issue de la session chargée', async () => {
    mockSession = makeSession(); // 30 frappes correctes régulières → flawless
    render(<ResultsPage {...baseProps} sessionId="s1" />);
    await waitFor(() =>
      expect(screen.getByText('verdict.flawless')).toBeInTheDocument(),
    );
  });

  it('retombe sur "brief" tant que la session n’est pas chargée', () => {
    render(<ResultsPage {...baseProps} />);
    expect(screen.getByText('verdict.brief')).toBeInTheDocument();
  });
});

describe('ResultsPage : partager / défier', () => {
  it('le bouton défier est désactivé tant qu’il n’y a pas de texte de session', () => {
    render(<ResultsPage {...baseProps} />);
    expect(screen.getByRole('button', { name: 'challenge' })).toBeDisabled();
  });

  it('défier copie un lien de challenge une fois la session chargée', async () => {
    mockSession = makeSession();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<ResultsPage {...baseProps} sessionId="s1" />);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'challenge' }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'challenge' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]![0])).toContain('/fr/challenge?c=');
  });
});
