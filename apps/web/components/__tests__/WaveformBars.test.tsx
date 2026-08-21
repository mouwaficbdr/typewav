import { act, render, screen } from '@testing-library/react';
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
    const bars = container.querySelectorAll('div[aria-hidden="true"] > div');
    expect(bars).toHaveLength(12);
  });

  it('rend sans crash avec un pitch actif', () => {
    render(<WaveformBars pitch={60} isError={false} />);
  });

  it('active une barre pour un pitch MIDI chromatique', async () => {
    const { container } = render(<WaveformBars pitch={66} isError={false} />);

    await act(async () => {
      await Promise.resolve();
    });

    const bars = Array.from(
      container.querySelectorAll('div[aria-hidden="true"] > div'),
    ) as HTMLDivElement[];

    expect(bars.some((bar) => bar.style.boxShadow.includes('0 0'))).toBe(true);
  });

  it('rend sans crash en état erreur', () => {
    render(<WaveformBars pitch={67} isError={true} />);
  });

  it('rend sans crash sans props', () => {
    render(<WaveformBars />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
