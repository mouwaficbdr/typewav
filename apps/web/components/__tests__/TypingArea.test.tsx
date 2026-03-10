import { render, screen } from '@testing-library/react';
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
    // La clé i18n 'hint' doit être affiché, pas le texte hardcodé FR
    expect(screen.getByText('hint')).toBeInTheDocument();
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
    // La classe accessible doit être présente
    expect(container.className).toContain('typing-focus-ring');
  });
});

describe('TypingArea — indicateur mode/collection', () => {
  it('affiche le badge de mode ghost quand mode=ghost', () => {
    render(
      <TypingArea text="hello world" mode="ghost" collectionId="litterature" />,
    );
    // L'indicateur de mode doit être visible
    const indicator = screen.getByLabelText('contextIndicatorLabel');
    expect(indicator).toBeInTheDocument();
  });

  it("n'affiche pas l'indicateur mode en mode classic sans collectionId", () => {
    render(<TypingArea text="hello world" mode="classic" />);
    expect(
      screen.queryByLabelText('contextIndicatorLabel'),
    ).not.toBeInTheDocument();
  });

  it('affiche la collection active si collectionId fourni', () => {
    render(
      <TypingArea
        text="hello world"
        mode="classic"
        collectionId="litterature"
      />,
    );
    const indicator = screen.getByLabelText('contextIndicatorLabel');
    expect(indicator).toBeInTheDocument();
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
