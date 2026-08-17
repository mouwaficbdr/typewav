import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Hoisted mocks (exécutés avant les imports de modules) ───────────────────

const mocks = vi.hoisted(() => ({
  playPreview: vi.fn().mockResolvedValue(undefined),
  isPlaying: false,
  hasPlayed: false,
}));

vi.mock('@/hooks/useAudioPreview', () => ({
  useAudioPreview: () => ({
    playPreview: mocks.playPreview,
    isPlaying: mocks.isPlaying,
    hasPlayed: mocks.hasPlayed,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('motion/react', () => ({
  motion: {
    button: ({
      whileTap: _wt,
      ...props
    }: ComponentProps<'button'> & { whileTap?: unknown }) => (
      <button {...props} />
    ),
  },
  useReducedMotion: () => false,
}));

// ─── Import après mocks ───────────────────────────────────────────────────────

import { AudioPreviewButton } from '../AudioPreviewButton';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AudioPreviewButton', () => {
  beforeEach(() => {
    mocks.playPreview.mockClear();
    mocks.isPlaying = false;
    mocks.hasPlayed = false;
  });

  it('est rendu dans la landing', () => {
    render(<AudioPreviewButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('ne joue aucune note avant le click (contrainte navigateur)', () => {
    render(<AudioPreviewButton />);
    expect(mocks.playPreview).not.toHaveBeenCalled();
  });

  it('appelle playPreview au click', () => {
    render(<AudioPreviewButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.playPreview).toHaveBeenCalledOnce();
  });

  it('affiche "play" quand hasPlayed est false', () => {
    render(<AudioPreviewButton />);
    expect(screen.getByText('play')).toBeInTheDocument();
  });

  it('affiche "replay" quand hasPlayed est true', () => {
    mocks.hasPlayed = true;
    render(<AudioPreviewButton />);
    expect(screen.getByText('replay')).toBeInTheDocument();
  });

  it('est désactivé pendant isPlaying', () => {
    mocks.isPlaying = true;
    render(<AudioPreviewButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('a un aria-label accessible', () => {
    render(<AudioPreviewButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'ariaLabel');
  });
});
