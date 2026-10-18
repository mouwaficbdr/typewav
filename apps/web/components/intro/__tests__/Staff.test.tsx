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
  it('step=3 : 2 notes done, 1 current, 3 todo', () => {
    const { container } = render(<Staff step={3} heads={[]} />);
    expect(container.querySelectorAll('[data-progress-state="done"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-progress-state="current"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-progress-state="todo"]')).toHaveLength(3);
  });

  it('data-note-heads reflète la longueur de heads', () => {
    const heads = Array.from({ length: 9 }, (_, i) => ({
      id: `h${i}`,
      note: 'E5',
    }));
    const { container } = render(<Staff step={2} heads={heads} />);
    expect(container.firstElementChild).toHaveAttribute('data-note-heads', '9');
  });

  it('data-staff-step reflète step', () => {
    const { container } = render(<Staff step={5} heads={[]} />);
    expect(container.firstElementChild).toHaveAttribute('data-staff-step', '5');
  });

  it('sous mouvement réduit : aucune animation de translation', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const heads = [{ id: 'h1', note: 'E5' }];
    const { container } = render(<Staff step={2} heads={heads} />);
    for (const el of container.querySelectorAll('*')) {
      expect((el as HTMLElement).style.transform).toBe('');
    }
    mockUseReducedMotion.mockReturnValue(false);
  });
});
