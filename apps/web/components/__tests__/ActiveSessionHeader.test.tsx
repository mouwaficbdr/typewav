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
