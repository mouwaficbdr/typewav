import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { LivingKeyboard, type LivingKeyboardHandle } from '../LivingKeyboard';

vi.mock('next-intl', async () => (await import('./intl')).nextIntlFr);

const { motionPref } = vi.hoisted(() => ({ motionPref: { reduce: false } }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => motionPref.reduce,
}));

const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  motionPref.reduce = false;
  // jsdom n'a pas de canvas : aucun dessin, mais le reste du clavier vit.
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  vi.useRealTimers();
});

const keyEl = (container: HTMLElement, code: string) =>
  container.querySelector(`g[data-code="${code}"]`);

describe('LivingKeyboard', () => {
  it('dessine les 50 touches, libellées selon la disposition', () => {
    const { container, rerender } = render(<LivingKeyboard layout="azerty" />);
    expect(container.querySelectorAll('g[data-code]')).toHaveLength(50);
    expect(keyEl(container, 'KeyQ')).toHaveTextContent('a');
    rerender(<LivingKeyboard layout="qwerty" />);
    expect(keyEl(container, 'KeyQ')).toHaveTextContent('q');
  });

  it("seule la cible porte la couleur, et le nom de son doigt s'écrit dessous", () => {
    const { container } = render(<LivingKeyboard layout="azerty" target="KeyF" />);
    const targets = container.querySelectorAll('[data-target]');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toHaveAttribute('data-code', 'KeyF');
    expect(targets[0]).toHaveAttribute('data-target', 'full');
    expect(screen.getByText(fr.typing.finger.LI)).toBeInTheDocument();
  });

  it('sans cible, aucune touche en couleur', () => {
    const { container } = render(<LivingKeyboard layout="azerty" />);
    expect(container.querySelector('[data-target]')).toBeNull();
  });

  it('les bosses de F et J sont toujours dessinées', () => {
    const { container } = render(<LivingKeyboard layout="azerty" />);
    const bumps = [...container.querySelectorAll('[data-bump]')].map((b) =>
      b.closest('g')?.getAttribute('data-code'),
    );
    expect(bumps.sort()).toEqual(['KeyF', 'KeyJ']);
  });

  it('aide sur hésitation : contour après le délai, recaché pour la cible suivante', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <LivingKeyboard layout="azerty" target="KeyA" hintAfterMs={1600} />,
    );
    expect(container.querySelector('[data-target]')).toBeNull();
    act(() => vi.advanceTimersByTime(1599));
    expect(container.querySelector('[data-target]')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(keyEl(container, 'KeyA')).toHaveAttribute('data-target', 'faint');

    rerender(<LivingKeyboard layout="azerty" target="KeyS" hintAfterMs={1600} />);
    expect(container.querySelector('[data-target]')).toBeNull();
    act(() => vi.advanceTimersByTime(1600));
    expect(keyEl(container, 'KeyS')).toHaveAttribute('data-target', 'faint');
  });

  it('chaque onde demandée est comptée, un code inconnu est ignoré', () => {
    const ref = createRef<LivingKeyboardHandle>();
    const { container } = render(<LivingKeyboard ref={ref} layout="azerty" />);
    const root = container.querySelector('[data-living-keyboard]');
    expect(root).not.toHaveAttribute('data-ripple-count');
    act(() => ref.current!.ripple('KeyF'));
    act(() => ref.current!.ripple('Inconnue'));
    expect(root).toHaveAttribute('data-ripple-count', '1');
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it("mouvement réduit : pas de canvas, la touche s'enfonce 120 ms", () => {
    motionPref.reduce = true;
    vi.useFakeTimers();
    const ref = createRef<LivingKeyboardHandle>();
    const { container } = render(<LivingKeyboard ref={ref} layout="azerty" />);
    expect(container.querySelector('canvas')).toBeNull();
    act(() => ref.current!.ripple('KeyF'));
    expect(keyEl(container, 'KeyF')).toHaveAttribute('data-pressed', 'true');
    act(() => vi.advanceTimersByTime(120));
    expect(keyEl(container, 'KeyF')).not.toHaveAttribute('data-pressed');
  });
});
