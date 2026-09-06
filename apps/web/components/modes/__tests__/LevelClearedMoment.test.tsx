import { act, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import frMessages from '../../../messages/fr.json';

vi.mock('next-intl', () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, unknown>) => {
      const path = `${namespace}.${key}`.split('.');
      let msg: unknown = frMessages;
      for (const segment of path) {
        msg = (msg as Record<string, unknown> | undefined)?.[segment];
      }
      if (typeof msg !== 'string') return `${namespace}.${key}`;
      return msg.replace(/\{(\w+)\}/g, (_m, token: string) =>
        String(values?.[token] ?? ''),
      );
    },
}));

let reduceMotion = false;

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: unknown }) => children,
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({
          children,
          initial: _i,
          animate: _a,
          exit: _e,
          transition: _tr,
          ...rest
        }: Record<string, unknown> & { children?: unknown }) =>
          createElement(tag, rest, children as never),
    },
  ),
  useReducedMotion: () => reduceMotion,
  useMotionValue: (v: number) => {
    let value = v;
    return {
      get: () => value,
      set: (x: number) => {
        value = x;
      },
      on: () => () => {},
    };
  },
  animate: () => ({ stop: () => {} }),
}));

const mockPlayNoteName = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({ playNoteName: mockPlayNoteName }),
}));

import { LevelClearedMoment } from '../LevelClearedMoment';

const baseProps = {
  levelId: 2,
  samples: 247,
  accuracy: 96,
  onDismiss: vi.fn(),
};

beforeEach(() => {
  reduceMotion = false;
  baseProps.onDismiss = vi.fn();
  mockPlayNoteName.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('LevelClearedMoment', () => {
  it('affiche le nom du niveau, sa tagline, la preuve chiffrée et le tag "validé"', () => {
    render(<LevelClearedMoment {...baseProps} />);

    expect(screen.getByText('Vers les aigus')).toBeInTheDocument();
    expect(
      screen.getByText(/Ta mélodie grimpe.+un rang\./),
    ).toBeInTheDocument();
    expect(screen.getByText('validé')).toBeInTheDocument();
    expect(
      screen.getByText(/frappes enchaînées à 96% de précision/),
    ).toBeInTheDocument();
  });

  it('porte une étiquette accessible qui annonce le déblocage', () => {
    const { container } = render(<LevelClearedMoment {...baseProps} />);
    expect(container.firstChild).toHaveAttribute(
      'aria-label',
      'Niveau 2 débloqué : Vers les aigus.',
    );
  });

  it('ne se ferme JAMAIS tout seul : il attend une action', () => {
    render(<LevelClearedMoment {...baseProps} />);

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(baseProps.onDismiss).not.toHaveBeenCalled();
  });

  it('se ferme à la première frappe, mais laisse Tab tranquille', () => {
    render(<LevelClearedMoment {...baseProps} />);

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(baseProps.onDismiss).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'a' });
    expect(baseProps.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('se ferme au clic, et ne déclenche onDismiss qu’une fois', () => {
    render(<LevelClearedMoment {...baseProps} />);

    fireEvent.pointerDown(window);
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.pointerDown(window);
    expect(baseProps.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('joue la cadence sonore (no-op silencieux si audio pas prêt)', () => {
    render(<LevelClearedMoment {...baseProps} />);

    act(() => {
      vi.advanceTimersByTime(1120 + 400);
    });
    expect(mockPlayNoteName).toHaveBeenCalled();
    expect(mockPlayNoteName.mock.calls.map((c) => c[0])).toEqual([
      'E4',
      'G4',
      'C5',
    ]);
  });

  it('prefers-reduced-motion : preuve chiffrée d’emblée, et attend toujours une frappe', () => {
    reduceMotion = true;
    render(<LevelClearedMoment {...baseProps} />);

    expect(screen.getByText(/247 frappes enchaînées/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(baseProps.onDismiss).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: ' ' });
    expect(baseProps.onDismiss).toHaveBeenCalledTimes(1);
  });
});
