import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockHandleKeystroke = vi.fn();
const mockHandleBackspace = vi.fn();

vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(() => ({
    position: 1,
    keystrokes: [{ char: 'h', timestamp: 1000, correct: true, deltaMs: 0 }],
    liveStats: { wpm: 0, accuracy: 100, consistency: 100 },
    isActive: true,
    isComplete: false,
    handleKeystroke: mockHandleKeystroke,
    handleBackspace: mockHandleBackspace,
    reset: vi.fn(),
    endSession: vi.fn(),
  })),
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

import { TypingArea } from '../typing/TypingArea';

// ─── Tests ────────────────────────────────────────────────────────────────────

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
    // L'overlay ne doit plus être présent après focus
    expect(
      screen.queryByTestId('typing-activation-overlay'),
    ).not.toBeInTheDocument();
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
