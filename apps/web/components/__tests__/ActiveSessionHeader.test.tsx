import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const piece = (id: string, midiPieceId: string | null) => ({
  id,
  midiPieceId,
  title: `Title ${id}`,
  shortTitle: `T${id}`,
  composer: `Composer ${id}`,
  register: 'contemplatif' as const,
});

const mockRecommendation = {
  currentPiece: null,
  register: 'contemplatif',
  refresh: vi.fn(),
  selectPiece: vi.fn(),
  allPieces: [piece('a', 'midi-a'), piece('b', 'midi-b'), piece('c', null)],
  playablePieces: [piece('a', 'midi-a'), piece('b', 'midi-b')],
  recommendedPlayablePieceId: 'midi-a',
};
vi.mock('@/hooks/useMusicRecommendation', () => ({
  useMusicRecommendation: () => mockRecommendation,
}));

import { ActiveSessionHeader } from '../typing/ActiveSessionHeader';

function renderHeader() {
  return render(
    <ActiveSessionHeader
      selectedPieceId={'midi-a' as never}
      onPieceChange={vi.fn()}
    />,
  );
}

describe('ActiveSessionHeader : accessibilité clavier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('le bouton du sélecteur déclare le menu (haspopup + expanded)', async () => {
    const user = userEvent.setup();
    renderHeader();

    const trigger = screen.getByRole('button', { name: /^T?a$|Title a|Ta/ });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('le menu ouvert a un nom accessible', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: 'Ta' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('library');
  });

  it('Échap ferme le menu et rend le focus au bouton', async () => {
    const user = userEvent.setup();
    renderHeader();

    const trigger = screen.getByRole('button', { name: 'Ta' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('ActiveSessionHeader : chip "Recommandation" (audit configbar, décision 5 / B4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('change réellement la musique jouée avec la pièce retournée par refresh(), pas une valeur figée', async () => {
    // Avant ce correctif : le clic lisait recommendedPlayablePieceId, qui ne
    // reflète le nouveau tirage qu'au rendu suivant (setCurrentPiece est
    // async côté hook) — donc onPieceChange recevait encore l'ancienne
    // pièce, ou aucune.
    mockRecommendation.refresh.mockReturnValue(piece('b', 'midi-b'));
    const onPieceChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ActiveSessionHeader
        selectedPieceId={'midi-a' as never}
        onPieceChange={onPieceChange}
      />,
    );

    await user.click(screen.getByTitle('recommendationCta'));

    expect(mockRecommendation.refresh).toHaveBeenCalledOnce();
    expect(onPieceChange).toHaveBeenCalledWith('midi-b');
  });

  it("retombe sur une pièce jouable du même registre si refresh() ne trouve rien (pool épuisé)", async () => {
    mockRecommendation.refresh.mockReturnValue(null);
    const onPieceChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ActiveSessionHeader
        selectedPieceId={'midi-a' as never}
        onPieceChange={onPieceChange}
      />,
    );

    await user.click(screen.getByTitle('recommendationCta'));

    // playablePieces du mock : la première pièce jouable du registre 'a'.
    expect(onPieceChange).toHaveBeenCalledWith('midi-a');
  });
});
