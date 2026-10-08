import { describe, expect, it } from 'vitest';
import type { Mastery } from '@typewav/types';
import {
  AUTOMATIC_MEDIAN_MS,
  MIN_ATTEMPTS,
  REVIEW_DAYS,
  WINDOW,
  dueForReview,
  keyState,
  lessonValidated,
  recordAttempt,
  weakestKeys,
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

  it('latence = écart avec la frappe précédente, null au-delà de 3 s, en début, si négative ou nulle', () => {
    let m = recordAttempt({}, { expected: 'e', correct: true, at: T0 }, null);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 250 }, T0);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 5000 }, T0 + 250);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 4000 }, T0 + 5000);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 4000 }, T0 + 4000);
    expect(m.e?.attempts.map((a) => a.latencyMs)).toEqual([null, 250, null, null, null]);
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

const DAY = 86_400_000;

describe('lessonValidated', () => {
  it('vrai quand toutes les nouvelles touches sont sûres ou automatiques', () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('a', MIN_ATTEMPTS, { gapMs: 300, mastery: m, start: T0 + 60_000 });
    expect(lessonValidated(m, ['e', 'a'])).toBe(true);
  });

  it('faux tant qu\'une touche est seulement apprise', () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('a', 5, { mastery: m, start: T0 + 60_000 });
    expect(lessonValidated(m, ['e', 'a'])).toBe(false);
  });

  it('faux pour une leçon sans nouvelle touche (le récital a sa propre règle)', () => {
    expect(lessonValidated(play('e', MIN_ATTEMPTS), [])).toBe(false);
  });
});

describe('dueForReview et reviewStep', () => {
  it('une touche sûre est due après REVIEW_DAYS[0] jour, pas avant', () => {
    const m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    const last = m.e!.lastSeenAt;
    expect(dueForReview(m, last + REVIEW_DAYS[0] * DAY - 1)).toEqual([]);
    expect(dueForReview(m, last + REVIEW_DAYS[0] * DAY)).toEqual(['e']);
  });

  it("reviewStep avance quand la touche reste sûre un autre jour, l'intervalle s'allonge", () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('e', 1, { mastery: m, start: T0 + 2 * DAY });
    expect(m.e?.reviewStep).toBe(1);
    const last = m.e!.lastSeenAt;
    expect(dueForReview(m, last + 2 * DAY)).toEqual([]);
    expect(dueForReview(m, last + REVIEW_DAYS[1] * DAY)).toEqual(['e']);
  });

  it('reviewStep revient à 0 quand la touche retombe à apprise', () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('e', 1, { mastery: m, start: T0 + 2 * DAY });
    m = play('e', 3, { mastery: m, start: T0 + 3 * DAY, wrong: [0, 1, 2] });
    expect(m.e?.reviewStep).toBe(0);
  });

  it("une touche seulement apprise n'est jamais due en révision", () => {
    const m = play('e', 3);
    expect(dueForReview(m, T0 + 60 * DAY)).toEqual([]);
  });
});

describe('weakestKeys', () => {
  it('trie par justesse récente, puis par lenteur ; une touche jamais jouée passe en premier', () => {
    let m = play('e', 10, { wrong: [0, 1, 2] }); // 70 %
    m = play('a', 10, { gapMs: 900, mastery: m, start: T0 + 60_000 }); // 100 %, lente
    m = play('s', 10, { gapMs: 200, mastery: m, start: T0 + 120_000 }); // 100 %, rapide
    expect(weakestKeys(m, ['s', 'a', 'e', 'i'], 3)).toEqual(['i', 'e', 'a']);
  });
});
