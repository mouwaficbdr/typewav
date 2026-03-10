import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPlayPreview = vi.fn().mockResolvedValue(undefined);
let mockIsPlaying = false;
let mockHasPlayed = false;

vi.mock('@/hooks/useAudioPreview', () => ({
  useAudioPreview: () => ({
    playPreview: mockPlayPreview,
    isPlaying: mockIsPlaying,
    hasPlayed: mockHasPlayed,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('motion/react', () => ({
  motion: {
    button: ({
      children,
      onClick,
      disabled,
      ...props
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      [key: string]: unknown;
    }) => (
      <button onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    ),
  },
  useReducedMotion: () => false,
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AudioPreviewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPlaying = false;
    mockHasPlayed = false;
  });

  it('est rendu dans la landing', async () => {
    const { AudioPreviewButton } =
      await import('@/components/typing/AudioPreviewButton');
    render(<AudioPreviewButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('affiche le texte "play" avant la première écoute', async () => {
    const { AudioPreviewButton } =
      await import('@/components/typing/AudioPreviewButton');
    render(<AudioPreviewButton />);
    expect(screen.getByText('play')).toBeInTheDocument();
  });

  it('affiche le texte "replay" après la première écoute', async () => {
    mockHasPlayed = true;
    const { AudioPreviewButton } =
      await import('@/components/typing/AudioPreviewButton');
    render(<AudioPreviewButton />);
    expect(screen.getByText('replay')).toBeInTheDocument();
  });

  it('appelle playPreview au clic', async () => {
    const user = userEvent.setup();
    const { AudioPreviewButton } =
      await import('@/components/typing/AudioPreviewButton');
    render(<AudioPreviewButton />);
    await user.click(screen.getByRole('button'));
    expect(mockPlayPreview).toHaveBeenCalledOnce();
  });

  it('est désactivé pendant la lecture (isPlaying=true)', async () => {
    mockIsPlaying = true;
    const { AudioPreviewButton } =
      await import('@/components/typing/AudioPreviewButton');
    render(<AudioPreviewButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('a un aria-label accessible', async () => {
    const { AudioPreviewButton } =
      await import('@/components/typing/AudioPreviewButton');
    render(<AudioPreviewButton />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'ariaLabel',
    );
  });
});
