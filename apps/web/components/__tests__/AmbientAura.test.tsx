import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseReducedMotion = vi.fn(() => false);
vi.mock('motion/react', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

import { AmbientAura } from '../typing/AmbientAura';
import { useAudioStore } from '@/stores/useAudioStore';
import { useProgressionStore } from '@/stores/useProgressionStore';

beforeEach(() => {
  mockUseReducedMotion.mockReturnValue(false);
  useProgressionStore.setState({ rank: 'novice' });
  useAudioStore.setState({ liveBpm: 80 });
});

afterEach(() => {
  useProgressionStore.setState({ rank: 'novice' });
  useAudioStore.setState({ liveBpm: 80 });
});

describe('AmbientAura', () => {
  it('est purement décorative : aria-hidden et ne bloque aucun clic', () => {
    const { container } = render(
      <AmbientAura pitch={null} isError={false} isPhraseBoundary={false} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper.style.pointerEvents).toBe('none');
  });

  it("reflète la couleur du rang actuel de l'utilisateur", () => {
    useProgressionStore.setState({ rank: 'ghost' });
    const { container } = render(
      <AmbientAura pitch={null} isError={false} isPhraseBoundary={false} />,
    );

    const glow = container.querySelector(
      'div[aria-hidden="true"] > div',
    ) as HTMLElement;
    // Couleur du rang 'ghost' (#FFD700, RANKS dans progression.ts) — jsdom
    // normalise le hex en rgb() dans le CSSOM sérialisé.
    expect(glow.style.background).toContain('rgb(255, 215, 0)');
  });

  it('traduit le tempo live en une durée de respiration (--beat-ms)', () => {
    useAudioStore.setState({ liveBpm: 120 }); // 60000/120 = 500ms
    const { container } = render(
      <AmbientAura pitch={null} isError={false} isPhraseBoundary={false} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper.style.getPropertyValue('--beat-ms')).toBe('500ms');
  });

  it('respecte prefers-reduced-motion : aucune animation de respiration', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { container } = render(
      <AmbientAura pitch={null} isError={false} isPhraseBoundary={false} />,
    );

    const glow = container.querySelector(
      'div[aria-hidden="true"] > div',
    ) as HTMLElement;
    expect(glow.style.animation).toBe('none');
  });

  it('rend sans crash sur une note en fin de phrase et une erreur', async () => {
    const { rerender } = render(
      <AmbientAura pitch={60} isError={false} isPhraseBoundary />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    rerender(<AmbientAura pitch={null} isError={true} isPhraseBoundary={false} />);
  });
});
