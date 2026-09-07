import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const {
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        drag: _d,
        dragConstraints: _dc,
        dragElastic: _de,
        onDragEnd: _od,
        ...rest
      } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

const piece = (
  id: string,
  midiPieceId: string | null,
  register = 'contemplatif',
) => ({
  id,
  midiPieceId,
  title: `Title ${id}`,
  shortTitle: `T${id}`,
  composer: `Composer ${id}`,
  register,
});

const recommendation = {
  currentPiece: null,
  register: 'contemplatif',
  refresh: vi.fn(() => piece('b', 'midi-b')),
  allPieces: [
    piece('a', 'midi-a', 'contemplatif'),
    piece('b', 'midi-b', 'energique'),
    piece('c', null, 'folk'),
  ],
  playablePieces: [
    piece('a', 'midi-a', 'contemplatif'),
    piece('b', 'midi-b', 'energique'),
  ],
};

vi.mock('@/hooks/useMusicRecommendation', () => ({
  useMusicRecommendation: () => recommendation,
}));

vi.mock('@/lib/music-filters', () => ({
  filterMusicPieces: (
    pieces: ReturnType<typeof piece>[],
    { query, register }: { query: string; register: string },
  ) =>
    pieces.filter(
      (p) =>
        (register === 'all' || p.register === register) &&
        (!query ||
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.composer.toLowerCase().includes(query.toLowerCase())),
    ),
}));

import { PieceLibrarySheet } from '../PieceLibrarySheet';

function setup(selected = 'midi-a') {
  const onPieceChange = vi.fn();
  const onClose = vi.fn();
  render(
    <PieceLibrarySheet
      open
      onClose={onClose}
      selectedPieceId={selected as never}
      onPieceChange={onPieceChange}
    />,
  );
  return { onPieceChange, onClose };
}

describe('PieceLibrarySheet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('liste les morceaux, jouables et à venir', () => {
    setup();
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByText('Title c')).toBeInTheDocument();
    // le morceau non jouable est désactivé
    const rowC = screen.getByText('Title c').closest('button')!;
    expect(rowC).toBeDisabled();
    expect(within(rowC).getByText('comingSoonBadge')).toBeInTheDocument();
  });

  it('choisir un morceau jouable : onPieceChange + fermeture', async () => {
    const user = userEvent.setup();
    const { onPieceChange, onClose } = setup('midi-a');
    await user.click(screen.getByText('Title b').closest('button')!);
    expect(onPieceChange).toHaveBeenCalledWith('midi-b');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('« Surprends-moi » applique la recommandation et ferme', async () => {
    const user = userEvent.setup();
    const { onPieceChange, onClose } = setup('midi-a');
    await user.click(screen.getByRole('button', { name: 'surpriseMe' }));
    expect(recommendation.refresh).toHaveBeenCalled();
    expect(onPieceChange).toHaveBeenCalledWith('midi-b');
    expect(onClose).toHaveBeenCalled();
  });

  it('la recherche filtre la liste', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(
      screen.getByLabelText('musicSearchPlaceholder'),
      'Title b',
    );
    expect(screen.getByText('Title b')).toBeInTheDocument();
    expect(screen.queryByText('Title a')).not.toBeInTheDocument();
  });

  it('les puces d’ambiance filtrent par registre', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'registerEnergique' }));
    expect(screen.getByText('Title b')).toBeInTheDocument();
    expect(screen.queryByText('Title a')).not.toBeInTheDocument();
  });
});
