import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import fr from '../../../messages/fr.json';
import en from '../../../messages/en.json';

const mockUseReducedMotion = vi.fn(() => false);
vi.mock('motion/react', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
  motion: {
    line: (props: Record<string, unknown>) => <line {...stripMotionProps(props)} />,
    circle: (props: Record<string, unknown>) => <circle {...stripMotionProps(props)} />,
    g: (props: Record<string, unknown>) => <g {...stripMotionProps(props)} />,
  },
}));

function stripMotionProps(props: Record<string, unknown>) {
  const {
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    ...rest
  } = props;
  return rest;
}

import { Staff } from '../Staff';

function keys(obj: object, prefix = ''): string[] {
  let out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out = out.concat(keys(v, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

describe('namespace intro : mêmes clés en fr et en', () => {
  it('fr et en ont exactement le même jeu de clés', () => {
    const frKeys = new Set(keys(fr.intro));
    const enKeys = new Set(keys(en.intro));
    expect([...frKeys].filter((k) => !enKeys.has(k))).toEqual([]);
    expect([...enKeys].filter((k) => !frKeys.has(k))).toEqual([]);
  });

  it('about.links.replayIntro existe en fr et en en', () => {
    expect(fr.about.links).toHaveProperty('replayIntro');
    expect(en.about.links).toHaveProperty('replayIntro');
  });
});

describe('Staff', () => {
  it('purement décorative : aucun cercle de progression (retiré le 2026-10-22, voir chrome-progress)', () => {
    const { container } = render(<Staff step={3} heads={[]} />);
    expect(container.querySelectorAll('[data-progress-state]')).toHaveLength(0);
  });

  it('data-note-heads reflète la longueur de heads', () => {
    const heads = Array.from({ length: 9 }, (_, i) => ({ id: `h${i}` }));
    const { container } = render(
      <Staff step={2} heads={heads} trailLength={9} />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-note-heads', '9');
  });

  it('data-staff-step reflète step', () => {
    const { container } = render(<Staff step={5} heads={[]} />);
    expect(container.firstElementChild).toHaveAttribute('data-staff-step', '5');
  });

  it('les têtes s’alignent de gauche à droite selon leur rang, pas selon une hauteur de note', () => {
    // mouvement réduit : `cx` est un attribut statique du <circle>, pas une
    // valeur animée (motion.circle mocké ne la reflète pas, voir plus haut).
    mockUseReducedMotion.mockReturnValue(true);
    const heads = [{ id: 'h0' }, { id: 'h1' }, { id: 'h2' }];
    const { container } = render(
      <Staff step={2} heads={heads} trailLength={3} />,
    );
    mockUseReducedMotion.mockReturnValue(false);
    const circles = [...container.querySelectorAll('circle')];
    expect(circles).toHaveLength(3);
    const xs = circles.map((c) => c.getAttribute('cx'));
    expect(xs).toEqual(['25%', '50%', '75%']);
    // Même ordonnée pour toutes : ligne horizontale, pas une portée à lire.
    const ys = new Set(circles.map((c) => c.getAttribute('cy')));
    expect(ys.size).toBe(1);
  });

  it('sous mouvement réduit : aucune animation de translation', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const heads = [{ id: 'h1' }];
    const { container } = render(<Staff step={2} heads={heads} />);
    for (const el of container.querySelectorAll('*')) {
      expect((el as HTMLElement).style.transform).toBe('');
    }
    mockUseReducedMotion.mockReturnValue(false);
  });
});
