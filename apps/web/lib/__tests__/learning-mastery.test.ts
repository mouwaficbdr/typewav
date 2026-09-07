import { describe, expect, it } from 'vitest';
import { applyLearningKeystrokes, type KeyMastery } from '../learning-progress';

describe('applyLearningKeystrokes', () => {
  it('accumule correct/total par id de geste', () => {
    const next = applyLearningKeystrokes({}, [
      { gestureId: 'e', correct: true },
      { gestureId: 'e', correct: false },
      { gestureId: 'é', correct: true },
    ]);
    expect(next['e']).toEqual({ correct: 1, total: 2 });
    expect(next['é']).toEqual({ correct: 1, total: 1 });
  });

  it('part d\'un état existant sans le muter', () => {
    const prev: KeyMastery = { e: { correct: 5, total: 5 } };
    const next = applyLearningKeystrokes(prev, [{ gestureId: 'e', correct: false }]);
    expect(next['e']).toEqual({ correct: 5, total: 6 });
    expect(prev['e']).toEqual({ correct: 5, total: 5 }); // non muté
  });

  it('traite les gestes Maj et touche morte comme des ids distincts', () => {
    const next = applyLearningKeystrokes({}, [
      { gestureId: 'E', correct: true },
      { gestureId: '^e', correct: true },
      { gestureId: 'e', correct: false },
    ]);
    expect(Object.keys(next).sort()).toEqual(['E', '^e', 'e']);
  });

  it('sur entrée vide, retourne une copie de l\'état', () => {
    const prev: KeyMastery = { a: { correct: 1, total: 1 } };
    const next = applyLearningKeystrokes(prev, []);
    expect(next).toEqual(prev);
    expect(next).not.toBe(prev);
  });
});
