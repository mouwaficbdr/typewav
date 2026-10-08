import { act, render, waitFor } from '@testing-library/react';
import type { Mastery } from '@typewav/types';
import { describe, expect, it, vi } from 'vitest';
import { PlacementTest, placementText } from '../PlacementTest';

const { typing } = vi.hoisted(() => ({
  typing: { props: null as null | Record<string, unknown> },
}));
vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: (props: Record<string, unknown>) => {
    typing.props = props;
    return <div data-testid="typing-area" />;
  },
}));

const { storage } = vi.hoisted(() => ({
  storage: {
    loadMastery: vi.fn(async () => ({ mastery: {}, persisted: true })),
    saveMastery: vi.fn(async (_m: Mastery) => true),
  },
}));
vi.mock('@/lib/conservatoire/storage', () => storage);

describe('PlacementTest', () => {
  it('30 secondes de mots fréquents en minuscules, sans navigation ni séance comptée', () => {
    render(<PlacementTest onDone={vi.fn()} />);
    const props = typing.props!;
    expect(props).toMatchObject({
      mode: 'classic',
      durationSeconds: 30,
      autoNavigate: false,
      trackProgress: false,
    });
    const words = String(props.text).split(' ');
    expect(words.length).toBeGreaterThanOrEqual(120);
    expect(words.every((w) => /^[a-z]+$/.test(w))).toBe(true);
  });

  it('les frappes nourrissent la maîtrise, sauvegardée à la fin ; le résultat est arrondi', async () => {
    const onDone = vi.fn();
    render(<PlacementTest onDone={onDone} />);
    await waitFor(() => expect(storage.loadMastery).toHaveBeenCalled());
    const props = typing.props as {
      onAttempt: (a: object) => void;
      onSessionComplete: (s: object) => void;
    };
    act(() => {
      props.onAttempt({ index: 0, expected: 'l', typed: 'l', correct: true, at: 1000 });
      props.onAttempt({ index: 1, expected: 'e', typed: 'r', correct: false, at: 1200 });
      props.onSessionComplete({ wpm: 34.4, accuracy: 95.6, correct: 1, total: 2, keystrokeData: [] });
    });
    const saved = storage.saveMastery.mock.calls[0]![0];
    expect(saved.l?.attempts).toHaveLength(1);
    expect(saved.e?.attempts[0]).toMatchObject({ correct: false, latencyMs: 200 });
    expect(onDone).toHaveBeenCalledWith({ wpm: 34, accuracy: 96 });
  });

  it('placementText mélange sans perdre ni dupliquer', () => {
    expect(placementText(['a', 'b', 'c'], () => 0).split(' ').sort()).toEqual(['a', 'b', 'c']);
  });
});
