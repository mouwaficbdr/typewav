import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { SessionResult } from '@typewav/types';
import { PracticeRoll } from '../PracticeRoll';

vi.mock('motion/react', () => {
  const passthrough = (tag: string) => {
    const Cmp = ({
      children,
      initial: _i,
      animate: _a,
      transition: _t,
      whileHover: _wh,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const El = tag as keyof React.JSX.IntrinsicElements;
      return <El {...(rest as object)}>{children}</El>;
    };
    Cmp.displayName = `motion.${tag}`;
    return Cmp;
  };
  return {
    motion: new Proxy({}, { get: (_t, p: string) => passthrough(p) }),
    useReducedMotion: () => false,
  };
});

function makeSessions(n: number): SessionResult[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${i}`,
    timestamp: 1_700_000_000_000 + i * 86_400_000,
    wpm: 40 + i,
    wpmRaw: 42 + i,
    accuracy: 90 + (i % 10),
    consistency: 80,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    collectionId: 'litterature',
    soundPackId: 'piano',
    keystrokeData: [],
  }));
}

const baseProps = {
  markLabel: (s: SessionResult) => `Rejouer ${s.id} · ${s.wpm} WPM`,
  rollLabel: (c: number) => `Historique de ${c} séances`,
  emptyLabel: 'Votre première marque apparaîtra ici.',
  onReplaySession: vi.fn(),
};

describe('PracticeRoll', () => {
  it('état vide : affiche le libellé d’amorce et aucun bouton de séance', () => {
    render(<PracticeRoll {...baseProps} sessions={[]} />);
    expect(
      screen.getByText('Votre première marque apparaîtra ici.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('rend un bouton accessible par séance', () => {
    render(<PracticeRoll {...baseProps} sessions={makeSessions(6)} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
    expect(
      screen.getByRole('button', { name: 'Rejouer s-0 · 40 WPM' }),
    ).toBeInTheDocument();
  });

  it('clic sur un bouton déclenche onReplaySession avec l’id de la séance', () => {
    const onReplaySession = vi.fn();
    render(
      <PracticeRoll
        {...baseProps}
        onReplaySession={onReplaySession}
        sessions={makeSessions(4)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Rejouer s-2 · 42 WPM' }));
    expect(onReplaySession).toHaveBeenCalledWith('s-2');
  });

  it('marque la séance qui détient un record', () => {
    render(
      <PracticeRoll
        {...baseProps}
        sessions={makeSessions(5)}
        recordWpmSessionId="s-3"
        recordAccSessionId="s-1"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Rejouer s-3 · 43 WPM' }),
    ).toHaveAttribute('data-record', 'wpm');
    expect(
      screen.getByRole('button', { name: 'Rejouer s-1 · 41 WPM' }),
    ).toHaveAttribute('data-record', 'accuracy');
    expect(
      screen.getByRole('button', { name: 'Rejouer s-0 · 40 WPM' }),
    ).not.toHaveAttribute('data-record');
  });

  it('marque les séances qui ont fait franchir un palier', () => {
    render(
      <PracticeRoll
        {...baseProps}
        sessions={makeSessions(5)}
        rankUpSessionIds={['s-1', 's-4']}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Rejouer s-1 · 41 WPM' }),
    ).toHaveAttribute('data-rankup');
    expect(
      screen.getByRole('button', { name: 'Rejouer s-4 · 44 WPM' }),
    ).toHaveAttribute('data-rankup');
    expect(
      screen.getByRole('button', { name: 'Rejouer s-2 · 42 WPM' }),
    ).not.toHaveAttribute('data-rankup');
  });

  it('le visuel porte un aria-label décrivant le nombre de séances', () => {
    render(<PracticeRoll {...baseProps} sessions={makeSessions(3)} />);
    expect(screen.getByLabelText('Historique de 3 séances')).toBeInTheDocument();
  });

  it('la règle de dates affiche deux bornes distinctes quand elles diffèrent', () => {
    render(
      <PracticeRoll
        {...baseProps}
        sessions={makeSessions(6)}
        formatRulerDate={(ts) =>
          new Date(ts).getUTCDate() < 15 ? 'début' : 'fin'
        }
      />,
    );
    expect(screen.getByText('début')).toBeInTheDocument();
    expect(screen.getByText('fin')).toBeInTheDocument();
  });

  it('la règle de dates fusionne en une seule borne quand elles sont identiques', () => {
    render(
      <PracticeRoll
        {...baseProps}
        sessions={makeSessions(6)}
        formatRulerDate={() => 'août 26'}
      />,
    );
    expect(screen.getAllByText('août 26')).toHaveLength(1);
  });
});

// garde-fou : le mock motion/react n'introduit pas de type any non voulu
export type _Guard = ComponentProps<typeof PracticeRoll>;
