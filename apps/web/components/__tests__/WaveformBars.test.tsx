import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
    }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

import { WaveformBars } from '../typing/WaveformBars';

describe('WaveformBars', () => {
  it('rend 12 barres', () => {
    const { container } = render(<WaveformBars />);
    // Le conteneur root est la div flex, ses enfants sont les barres
    const rootDiv = container.firstElementChild;
    expect(rootDiv?.children).toHaveLength(12);
  });

  it('rend sans crash avec une note active', () => {
    render(<WaveformBars lastNote="C4" isError={false} />);
    // Pas d'exception = succès
  });

  it('rend sans crash en état erreur', () => {
    render(<WaveformBars lastNote="G4" isError={true} />);
  });

  it('rend sans crash sans props', () => {
    render(<WaveformBars />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
