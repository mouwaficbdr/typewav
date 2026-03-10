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
