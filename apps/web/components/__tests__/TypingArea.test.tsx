import type { KeystrokeEntry } from '@typewav/types';
import { fireEvent, render, screen } from '@testing-library/react';
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
    const container = screen.getByRole('textbox');
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
    const area = screen.getByRole('textbox');
    // useEffect met le focus auto — simuler un blur pour afficher l'overlay
    fireEvent.blur(area);
    expect(screen.getByTestId('typing-activation-overlay')).toBeInTheDocument();
  });

  it("cache l'overlay hint après focus sur la zone de frappe", async () => {
    const user = userEvent.setup();
    render(<TypingArea text="hello world" />);
    const area = screen.getByRole('textbox');
    await user.click(area);
    // L'overlay reste monté pour une transition fluide, mais devient invisible.
    expect(screen.getByTestId('typing-activation-overlay')).toHaveStyle({
      opacity: '0',
    });
  });
});

describe('TypingArea — Backspace', () => {
  it('appelle handleBackspace quand la touche Backspace est pressée', async () => {
    const user = userEvent.setup();
    render(<TypingArea text="hello world" />);

    const container = screen.getByRole('textbox');
    await user.click(container);
    await user.keyboard('{Backspace}');

    expect(mockHandleBackspace).toHaveBeenCalledOnce();
  });

  it("ne joue pas de note sur Backspace (triggerSilence n'est pas appelé non plus)", async () => {
    const user = userEvent.setup();
    render(<TypingArea text="hello world" />);

    const container = screen.getByRole('textbox');
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
    mockPlayNote.mockResolvedValueOnce('C4');
    const onNoteChange = vi.fn();
    const user = userEvent.setup();

    render(<TypingArea text="hello world" onNoteChange={onNoteChange} />);

    const container = screen.getByRole('textbox');
    await user.click(container);
    await user.keyboard('e');

    expect(onNoteChange).toHaveBeenCalledWith('C4', false);
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
