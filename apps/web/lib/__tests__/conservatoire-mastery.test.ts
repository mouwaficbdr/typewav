import { describe, expect, it } from 'vitest';
import type { Mastery } from '@typewav/types';
import {
  AUTOMATIC_MEDIAN_MS,
  MIN_ATTEMPTS,
  WINDOW,
  keyState,
  recordAttempt,
} from '../conservatoire/mastery';

const T0 = new Date(2026, 9, 8, 10, 0, 0).getTime();

/** Joue `n` frappes sur `char`, espacées de `gapMs`, justes sauf celles listées. */
function play(
  char: string,
  n: number,
  { gapMs = 300, wrong = [] as number[], start = T0, mastery = {} as Mastery } = {},
): Mastery {
  let m = mastery;
  let previousAt: number | null = null;
  for (let i = 0; i < n; i += 1) {
    const at = start + i * gapMs;
    m = recordAttempt(m, { expected: char, correct: !wrong.includes(i), at }, previousAt);
    previousAt = at;
  }
  return m;
}

describe('recordAttempt', () => {
  it('attribue la tentative au geste du caractère attendu, juste ou faux', () => {
    const m = recordAttempt({}, { expected: 'ê', correct: false, at: T0 }, null);
    expect(m['^e']?.attempts).toEqual([{ correct: false, latencyMs: null, at: T0 }]);
  });

  it('ignore un caractère sans geste (espace, symbole hors curriculum)', () => {
    expect(recordAttempt({}, { expected: ' ', correct: true, at: T0 }, null)).toEqual({});
    expect(recordAttempt({}, { expected: '@', correct: true, at: T0 }, null)).toEqual({});
  });

  it('latence = écart avec la frappe précédente, null au-delà de 3 s, en début ou si négative', () => {
    let m = recordAttempt({}, { expected: 'e', correct: true, at: T0 }, null);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 250 }, T0);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 5000 }, T0 + 250);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 4000 }, T0 + 5000);
    expect(m.e?.attempts.map((a) => a.latencyMs)).toEqual([null, 250, null, null]);
  });

  it('ne garde jamais plus de WINDOW tentatives', () => {
    const m = play('e', WINDOW + 15);
    expect(m.e?.attempts).toHaveLength(WINDOW);
    expect(m.e?.attempts[0]?.at).toBe(T0 + 15 * 300);
  });

  it("une erreur corrigée compte : faux puis juste sur la même position = deux tentatives (D11)", () => {
    let m = recordAttempt({}, { expected: 'e', correct: false, at: T0 }, null);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 400 }, T0);
    expect(m.e?.attempts.map((a) => a.correct)).toEqual([false, true]);
  });

  it('ne modifie pas la maîtrise reçue (immuable)', () => {
    const before: Mastery = {};
    recordAttempt(before, { expected: 'e', correct: true, at: T0 }, null);
    expect(before).toEqual({});
  });
});

describe('keyState', () => {
  it('new sans tentative juste', () => {
    expect(keyState(undefined)).toBe('new');
    expect(keyState(play('e', 3, { wrong: [0, 1, 2] }).e)).toBe('new');
  });

  it('learned dès une tentative juste, tant que MIN_ATTEMPTS ou 95 % ne sont pas atteints', () => {
    expect(keyState(play('e', 1).e)).toBe('learned');
    expect(keyState(play('e', MIN_ATTEMPTS - 1).e)).toBe('learned');
    expect(keyState(play('e', MIN_ATTEMPTS, { wrong: [0, 1] }).e)).toBe('learned');
  });

  it('sure à MIN_ATTEMPTS frappes et au moins 95 % sur la fenêtre, lentes', () => {
    expect(keyState(play('e', MIN_ATTEMPTS, { gapMs: 800 }).e)).toBe('sure');
  });

  it('automatic quand la médiane des latences justes est sous le seuil', () => {
    expect(keyState(play('e', MIN_ATTEMPTS, { gapMs: AUTOMATIC_MEDIAN_MS - 50 }).e)).toBe('automatic');
  });

  it('retombe à learned quand la justesse récente passe sous 95 %', () => {
    let m = play('e', WINDOW, { gapMs: 800 });
    expect(keyState(m.e)).toBe('sure');
    m = play('e', 3, { gapMs: 800, wrong: [0, 1, 2], start: T0 + 60_000, mastery: m });
    expect(keyState(m.e)).toBe('learned');
  });
});
