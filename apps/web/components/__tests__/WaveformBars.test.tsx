import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseReducedMotion = vi.fn(() => false);
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
    }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => mockUseReducedMotion(),
}));

import { WaveformBars } from '../typing/WaveformBars';

beforeEach(() => {
  mockUseReducedMotion.mockReturnValue(false);
});

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

  it("n'illumine qu'une seule barre pour une note normale", async () => {
    const { container } = render(
      <WaveformBars pitch={66} isError={false} isPhraseBoundary={false} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const bars = Array.from(
      container.querySelectorAll('div[aria-hidden="true"] > div'),
    ) as HTMLDivElement[];
    const litBars = bars.filter((bar) => bar.style.boxShadow.includes('0 0'));

    expect(litBars).toHaveLength(1);
  });

  it('illumine aussi les barres voisines pour une fin de phrase musicale', async () => {
    const { container } = render(
      <WaveformBars pitch={66} isError={false} isPhraseBoundary />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const bars = Array.from(
      container.querySelectorAll('div[aria-hidden="true"] > div'),
    ) as HTMLDivElement[];
    const litBars = bars.filter((bar) => bar.style.boxShadow.includes('0 0'));

    expect(litBars.length).toBeGreaterThan(1);
  });

  it('rend sans crash sans props', () => {
    render(<WaveformBars />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('avec idlePulse, fait pulser les barres en boucle', () => {
    const { container } = render(<WaveformBars idlePulse />);
    const bars = Array.from(
      container.querySelectorAll('div[aria-hidden="true"] > div'),
    ) as HTMLDivElement[];
    expect(
      bars.some((bar) => bar.style.animation.includes('typewav-idle-pulse')),
    ).toBe(true);
  });

  it('respecte prefers-reduced-motion : pas de pulsation idle en boucle', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { container } = render(<WaveformBars idlePulse />);
    const bars = Array.from(
      container.querySelectorAll('div[aria-hidden="true"] > div'),
    ) as HTMLDivElement[];
    expect(
      bars.every((bar) => !bar.style.animation.includes('typewav-idle-pulse')),
    ).toBe(true);
  });
});
