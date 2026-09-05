import type { KeystrokeEntry } from '@typewav/types';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockHandleKeystroke = vi.fn();
const mockHandleBackspace = vi.fn();

const defaultMockSessionState = {
  position: 1,
  keystrokes: [
    { char: 'h', timestamp: 1000, correct: true, deltaMs: 0 },
  ] as KeystrokeEntry[],
  liveStats: { wpm: 0, accuracy: 100, consistency: 100 },
  finalStats: null as {
    wpm: number;
    wpmNet: number;
    accuracy: number;
    consistency: number;
  } | null,
  secondsRemaining: null as number | null,
  isActive: true,
  isComplete: false,
  handleKeystroke: mockHandleKeystroke,
  handleBackspace: mockHandleBackspace,
  reset: vi.fn(),
  endSession: vi.fn(),
};

const mockSessionState = { ...defaultMockSessionState };

vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(() => mockSessionState),
}));

const mockPlayNote = vi.fn().mockResolvedValue(undefined);
const mockTriggerSilence = vi.fn();
const mockTriggerResume = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    playNote: mockPlayNote,
    triggerSilence: mockTriggerSilence,
    triggerResume: mockTriggerResume,
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'fr' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('@/components/typing/GhostCursor', () => ({
  GhostCursor: () => null,
}));

const mockResetSequence = vi.fn();
vi.mock('@typewav/audio-engine', () => ({
  resetSequence: (...args: unknown[]) => mockResetSequence(...args),
}));

import { TypingArea } from '../typing/TypingArea';

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  Object.assign(mockSessionState, defaultMockSessionState);
});

describe('TypingArea — i18n hint text', () => {
  it('affiche le hint text depuis les traductions (non hardcodé)', () => {
    render(<TypingArea text="hello world" />);
    // Le hint 'hint' doit apparaître dans l'overlay (aria-hidden) ou le composant
    // après le focus ou dans l'overlay — on vérifie qu'aucun texte hardcodé FR n'est présent
    expect(
      screen.queryByText(
        'cliquer pour activer · chaque frappe produit une note',
      ),
    ).not.toBeInTheDocument();
  });
});

describe('TypingArea — accessibilité focus ring', () => {
  it("n'a pas de focus:outline-none sans remplacement accessible", () => {
    render(<TypingArea text="hello world" />);
    const container = screen.getByRole('application');
    // La classe focus:outline-none ne doit plus être présente
    expect(container.className).not.toContain('focus:outline-none');
    // La zone doit rester focusable clavier
    expect(container).toHaveAttribute('tabindex', '0');
  });
});

describe('TypingArea — indicateur mode/collection', () => {
  it("n'affiche pas l'indicateur mode en mode classic sans collectionId", () => {
    render(<TypingArea text="hello world" mode="classic" />);
    expect(
      screen.queryByLabelText('contextIndicatorLabel'),
    ).not.toBeInTheDocument();
  });
});

describe('TypingArea — affordance activation (Fix D)', () => {
  it('affiche un overlay hint après blur sur la zone de frappe', () => {
    render(<TypingArea text="hello world" />);
    const area = screen.getByRole('application');
    // useEffect met le focus auto — simuler un blur pour afficher l'overlay
    fireEvent.blur(area);
    expect(screen.getByTestId('typing-activation-overlay')).toBeInTheDocument();
  });

  it("cache l'overlay hint après focus sur la zone de frappe", async () => {
    const user = userEvent.setup();
    render(<TypingArea text="hello world" />);
    const area = screen.getByRole('application');
    await user.click(area);
    // L'overlay reste monté pour une transition fluide, mais devient invisible.
    expect(screen.getByTestId('typing-activation-overlay')).toHaveStyle({
      opacity: '0',
    });
  });

  it("affiche une icône curseur juste avant le texte de l'overlay (ticket #62)", () => {
    render(<TypingArea text="hello world" />);
    const area = screen.getByRole('application');
    fireEvent.blur(area);
    const overlay = screen.getByTestId('typing-activation-overlay');
    expect(
      within(overlay).getByTestId('typing-activation-cursor-icon'),
    ).toBeInTheDocument();
  });
});

describe('TypingArea — Backspace', () => {
  it('appelle handleBackspace quand la touche Backspace est pressée', async () => {
    const user = userEvent.setup();
    render(<TypingArea text="hello world" />);

    const container = screen.getByRole('application');
    await user.click(container);
    await user.keyboard('{Backspace}');

    expect(mockHandleBackspace).toHaveBeenCalledOnce();
  });

  it("ne joue pas de note sur Backspace (triggerSilence n'est pas appelé non plus)", async () => {
    const user = userEvent.setup();
    render(<TypingArea text="hello world" />);

    const container = screen.getByRole('application');
    await user.click(container);
    await user.keyboard('{Backspace}');

    expect(mockPlayNote).not.toHaveBeenCalled();
    expect(mockTriggerSilence).not.toHaveBeenCalled();
  });
});

describe('TypingArea — nouvelle tentative', () => {
  it('remet le séquenceur MIDI à zéro au montage (nouveau test/restart)', () => {
    mockResetSequence.mockClear();
    render(<TypingArea text="hello world" />);
    expect(mockResetSequence).toHaveBeenCalledOnce();
  });
});

describe('TypingArea — waveform note source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envoie la note jouee (pas la touche brute) a onNoteChange', async () => {
    mockPlayNote.mockResolvedValueOnce({ note: 'C4', isPhraseBoundary: false });
    const onNoteChange = vi.fn();
    const user = userEvent.setup();

    render(<TypingArea text="hello world" onNoteChange={onNoteChange} />);

    const container = screen.getByRole('application');
    await user.click(container);
    await user.keyboard('e');

    expect(onNoteChange).toHaveBeenCalledWith('C4', false, false);
  });

  it('signale une fin de phrase à onNoteChange quand la note jouée en marque une', async () => {
    mockPlayNote.mockResolvedValueOnce({ note: 'E4', isPhraseBoundary: true });
    const onNoteChange = vi.fn();
    const user = userEvent.setup();

    render(<TypingArea text="hello world" onNoteChange={onNoteChange} />);

    const container = screen.getByRole('application');
    await user.click(container);
    await user.keyboard('e');

    expect(onNoteChange).toHaveBeenCalledWith('E4', false, true);
  });
});

describe('TypingArea — mode zen', () => {
  it('masque le bandeau de stats live en mode zen ("sans pression")', () => {
    render(<TypingArea text="hello world" mode="zen" />);
    expect(screen.queryByTestId('live-stats-overlay')).not.toBeInTheDocument();
  });

  it('affiche le bandeau de stats live dans les autres modes', () => {
    render(<TypingArea text="hello world" mode="classic" />);
    expect(screen.getByTestId('live-stats-overlay')).toBeInTheDocument();
  });
});

describe('TypingArea — compte à rebours (audit configbar, décision 1)', () => {
  it('affiche le temps restant en mode classic', () => {
    Object.assign(mockSessionState, { secondsRemaining: 12 });
    render(<TypingArea text="hello world" mode="classic" />);
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('12');
  });

  it("n'affiche rien si secondsRemaining est null, même en mode classic", () => {
    Object.assign(mockSessionState, { secondsRemaining: null });
    render(<TypingArea text="hello world" mode="classic" />);
    expect(screen.queryByTestId('time-remaining')).not.toBeInTheDocument();
  });

  it('ne s’affiche pas hors du mode classic, même si secondsRemaining est fourni', () => {
    Object.assign(mockSessionState, { secondsRemaining: 12 });
    render(<TypingArea text="hello world" mode="sprint" />);
    expect(screen.queryByTestId('time-remaining')).not.toBeInTheDocument();
  });
});

describe('TypingArea — redémarrer à tout moment (Tab + Entrée, ticket #61)', () => {
  // mockHandleKeystroke n'est pas remis à zéro entre tests par défaut
  // (pas de clearMocks global dans vitest.config.ts) : sans ce nettoyage
  // local, une assertion .not.toHaveBeenCalled() ici pourrait accuser un
  // appel laissé par un describe précédent, pas notre propre logique.
  beforeEach(() => {
    mockHandleKeystroke.mockClear();
  });

  it('Tab puis Entrée appelle onRestart pendant la frappe active', async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(<TypingArea text="hello world" onRestart={onRestart} />);

    const container = screen.getByRole('application');
    await user.click(container);
    await user.keyboard('{Tab}{Enter}');

    expect(onRestart).toHaveBeenCalledOnce();
    expect(mockHandleKeystroke).not.toHaveBeenCalled();
  });

  it('Tab puis Entrée appelle onRestart même après la fin de session (modes sans navigation auto)', async () => {
    mockSessionState.isComplete = true;
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(<TypingArea text="hello world" onRestart={onRestart} />);

    const container = screen.getByRole('application');
    await user.click(container);
    await user.keyboard('{Tab}{Enter}');

    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("Tab puis une autre touche désarme sans redémarrer, et la frappe suivante est traitée normalement", async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(<TypingArea text="hello world" onRestart={onRestart} />);

    const container = screen.getByRole('application');
    await user.click(container);
    await user.keyboard('{Tab}x');

    expect(onRestart).not.toHaveBeenCalled();
    expect(mockHandleKeystroke).toHaveBeenCalledWith('x');
  });

  it('ne casse rien si onRestart n’est pas fourni', async () => {
    const user = userEvent.setup();
    render(<TypingArea text="hello world" />);

    const container = screen.getByRole('application');
    await user.click(container);
    await expect(user.keyboard('{Tab}{Enter}')).resolves.not.toThrow();
  });
});

describe('TypingArea — fin de session', () => {
  it('reporte finalStats.wpm, pas liveStats.wpm (qui peut être resté à 0)', () => {
    mockSessionState.isComplete = true;
    mockSessionState.liveStats = { wpm: 0, accuracy: 100, consistency: 100 };
    mockSessionState.finalStats = {
      wpm: 42,
      wpmNet: 40,
      accuracy: 95,
      consistency: 88,
    };

    const onComplete = vi.fn();
    const onSessionComplete = vi.fn();

    render(
      <TypingArea
        text="hello world"
        onComplete={onComplete}
        onSessionComplete={onSessionComplete}
      />,
    );

    expect(onComplete).toHaveBeenCalledWith(42);
    expect(onSessionComplete).toHaveBeenCalledWith(
      expect.objectContaining({ wpm: 42 }),
    );
  });

  it("n'appelle pas les callbacks de fin tant que finalStats n'est pas encore calculé", () => {
    mockSessionState.isComplete = true;
    mockSessionState.finalStats = null;

    const onComplete = vi.fn();
    const onSessionComplete = vi.fn();

    render(
      <TypingArea
        text="hello world"
        onComplete={onComplete}
        onSessionComplete={onSessionComplete}
      />,
    );

    expect(onComplete).not.toHaveBeenCalled();
    expect(onSessionComplete).not.toHaveBeenCalled();
  });
});

describe("TypingArea — accessibilité lecteur d'écran (WS-1)", () => {
  beforeEach(() => {
    Object.assign(mockSessionState, defaultMockSessionState, {
      liveStats: { wpm: 0, accuracy: 100, consistency: 100 },
      finalStats: null,
      isComplete: false,
      position: 0,
    });
  });

  it('expose la zone de frappe comme role="application", jamais "textbox"', () => {
    render(<TypingArea text="hello world" />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it("décrit la zone de frappe par des instructions résolues pour le lecteur d'écran", () => {
    render(<TypingArea text="hello world" />);
    const area = screen.getByRole('application');
    const describedBy = area.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'ariaTypingInstructions',
    );
  });

  it("expose le texte cible complet aux technologies d'assistance", () => {
    render(<TypingArea text="hello world" />);
    expect(screen.getByTestId('typing-target-text')).toHaveTextContent(
      'hello world',
    );
  });

  it('fournit une région live polite discrète, muette tant qu\'aucun palier n\'est franchi', () => {
    render(<TypingArea text="hello world" />);
    const live = screen.getByTestId('typing-live-region');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveClass('sr-only');
    expect(live).toBeEmptyDOMElement();
  });

  it('annonce la progression quand un palier de 25 % est franchi', () => {
    const { rerender } = render(<TypingArea text="aaaa bbbb" />);
    expect(screen.getByTestId('typing-live-region')).toBeEmptyDOMElement();

    Object.assign(mockSessionState, {
      position: 5, // 5 / 9 ≈ 55 %
      liveStats: { wpm: 42, accuracy: 97, consistency: 100 },
    });
    rerender(<TypingArea text="aaaa bbbb" />);

    expect(screen.getByTestId('typing-live-region')).toHaveTextContent(
      'srProgress',
    );
  });

  it('annonce la fin du texte via la région live', () => {
    Object.assign(mockSessionState, {
      position: 'hello world'.length,
      isComplete: true,
      finalStats: { wpm: 50, wpmNet: 48, accuracy: 99, consistency: 90 },
    });
    render(<TypingArea text="hello world" />);
    expect(screen.getByTestId('typing-live-region')).toHaveTextContent(
      'srComplete',
    );
  });

  it('ne montre pas d\'anneau de focus : le caret est l\'indicateur, la zone reste focusable', () => {
    const { container } = render(<TypingArea text="hello world" />);
    const area = screen.getByRole('application');
    // Pas de hack : aucun outline:none en style inline ni en classe Tailwind.
    expect(area.style.outline).toBe('');
    expect(area.className).not.toContain('outline-none');
    // La zone reste atteignable au clavier.
    expect(area).toHaveAttribute('tabindex', '0');
    // Le caret (.char-current) porte la position et le focus.
    expect(container.querySelector('.char-current')).not.toBeNull();
  });
});
