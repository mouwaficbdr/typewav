import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const stripMotionProps = (props: Record<string, unknown>) => {
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
  return rest;
};

vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <div {...stripMotionProps(props)}>{children}</div>
    ),
  },
}));

import { BottomSheet } from '../BottomSheet';

describe('BottomSheet', () => {
  it('ne rend rien quand fermée', () => {
    render(
      <BottomSheet open={false} onClose={vi.fn()} title="Titre">
        <p>contenu</p>
      </BottomSheet>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rend un dialog nommé avec son contenu quand ouverte', () => {
    render(
      <BottomSheet open onClose={vi.fn()} title="Choisir un morceau">
        <p>contenu</p>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Choisir un morceau');
    expect(screen.getByText('contenu')).toBeInTheDocument();
  });

  it('ferme via Échap', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <BottomSheet open onClose={onClose} title="Titre">
        <p>x</p>
      </BottomSheet>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ferme via le bouton de fermeture', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <BottomSheet open onClose={onClose} title="Titre">
        <p>x</p>
      </BottomSheet>,
    );
    await user.click(screen.getByRole('button', { name: /fermer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ferme via un clic sur le fond, pas sur le panneau', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <BottomSheet open onClose={onClose} title="Titre">
        <p>contenu</p>
      </BottomSheet>,
    );
    await user.click(screen.getByText('contenu'));
    expect(onClose).not.toHaveBeenCalled();
    // le fond est le parent du dialog
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
