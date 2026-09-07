import 'fake-indexeddb/auto';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (namespace === 'typing.collection') {
      const labels: Record<string, string> = { litterature: 'Littérature' };
      return labels[key] ?? key;
    }
    if (key === 'langBoth') return 'français + anglais';
    return key;
  },
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

const piece = (id: string, midiPieceId: string | null) => ({
  id,
  midiPieceId,
  title: `Title ${id}`,
  shortTitle: `Short ${id}`,
  composer: `Composer ${id}`,
  register: 'contemplatif',
});

vi.mock('@/hooks/useMusicRecommendation', () => ({
  useMusicRecommendation: () => ({
    currentPiece: null,
    register: 'contemplatif',
    refresh: vi.fn(),
    allPieces: [piece('a', 'midi-a'), piece('c', null)],
    playablePieces: [piece('a', 'midi-a')],
  }),
}));

vi.mock('@/lib/music-filters', () => ({
  filterMusicPieces: (p: unknown[]) => p,
}));

import { DEFAULT_CONFIG, useConfigStore } from '@/stores/useConfigStore';
import { PieceDeckBar } from '../PieceDeckBar';

beforeEach(async () => {
  await act(async () => {
    await useConfigStore.persist.rehydrate();
    useConfigStore.setState(DEFAULT_CONFIG);
  });
});

function setup(mode = 'classic', selected = 'midi-a') {
  const onPieceChange = vi.fn();
  render(
    <PieceDeckBar
      selectedPieceId={selected as never}
      onPieceChange={onPieceChange}
      effectiveMode={mode as never}
    />,
  );
  return { onPieceChange };
}

describe('PieceDeckBar', () => {
  it('affiche le morceau sélectionné et son état jouable', () => {
    setup('classic', 'midi-a');
    expect(screen.getByText('Short a')).toBeInTheDocument();
    expect(screen.getByText('playableBadge')).toBeInTheDocument();
  });

  it('affiche "bientôt" pour un morceau non jouable', () => {
    setup('classic', 'midi-x-inconnu');
    expect(screen.getByText('comingSoonBadge')).toBeInTheDocument();
  });

  it('ouvre la bibliothèque au tap sur la barre', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Short a/ }));
    expect(
      screen.getByRole('dialog', { name: 'libraryTitle' }),
    ).toBeInTheDocument();
  });

  it('ouvre la feuille texte au tap sur la puce collection · langue', async () => {
    const user = userEvent.setup();
    setup('classic');
    await user.click(
      screen.getByRole('button', { name: /Littérature · français \+ anglais/ }),
    );
    expect(
      screen.getByRole('dialog', { name: 'textContextTitle' }),
    ).toBeInTheDocument();
  });

  it('mode Libre : pas de puce texte (texte perso, ni collection ni langue)', () => {
    setup('custom');
    expect(
      screen.queryByRole('button', { name: /Littérature/ }),
    ).not.toBeInTheDocument();
  });
});
