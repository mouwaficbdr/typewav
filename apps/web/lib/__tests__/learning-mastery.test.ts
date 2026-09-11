import { describe, expect, it } from 'vitest';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';
import {
  applyLearningKeystrokes,
  canUnlockCurriculumLevel,
  calculateCurriculumProgress,
  type KeyMastery,
} from '../learning-progress';

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

const L3 = LEARNING_CURRICULUM_AZERTY[2]!; // top-row, 10 newKeys, 90/20
const L11 = LEARNING_CURRICULUM_AZERTY[10]!; // full-score, text, newKeys []

function fullMastery(level = L3, correct = 20, total = 20) {
  const m: Record<string, { correct: number; total: number }> = {};
  for (const k of level.newKeys) m[k.id] = { correct, total };
  return m;
}

describe('canUnlockCurriculumLevel', () => {
  it('faux tant qu\'une seule newKey est sous sa barre (aucune soupape)', () => {
    const m = fullMastery();
    m[L3.newKeys[0]!.id] = { correct: 15, total: 20 }; // 75 % < 90 %
    expect(canUnlockCurriculumLevel(L3, m, { samples: 999, accuracy: 100 })).toBe(
      false,
    );
  });

  it('faux si une newKey n\'a pas assez d\'échantillons', () => {
    const m = fullMastery();
    m[L3.newKeys[1]!.id] = { correct: 10, total: 10 }; // 100 % mais total 10 < 20
    expect(canUnlockCurriculumLevel(L3, m, { samples: 999, accuracy: 100 })).toBe(
      false,
    );
  });

  it('vrai quand toutes les newKeys atteignent leur barre', () => {
    expect(
      canUnlockCurriculumLevel(L3, fullMastery(), {
        samples: 0,
        accuracy: 0,
      }),
    ).toBe(true);
  });

  it('niveau text : exige aussi minSamplesTotal et minOverallAccuracy', () => {
    expect(
      canUnlockCurriculumLevel(L11, {}, { samples: 100, accuracy: 99 }),
    ).toBe(false); // pas assez de samples
    expect(
      canUnlockCurriculumLevel(L11, {}, { samples: 500, accuracy: 90 }),
    ).toBe(false); // précision sous 95
    expect(
      canUnlockCurriculumLevel(L11, {}, { samples: 500, accuracy: 96 }),
    ).toBe(true);
  });
});

describe('calculateCurriculumProgress', () => {
  it('pourcentage = fraction des newKeys ayant atteint leur barre', () => {
    const m = fullMastery();
    m[L3.newKeys[0]!.id] = { correct: 0, total: 0 };
    m[L3.newKeys[1]!.id] = { correct: 10, total: 20 };
    const r = calculateCurriculumProgress(L3, m);
    expect(r.percent).toBe(80); // 8/10
  });

  it('weakestKeyId = la touche la plus loin de sa barre', () => {
    const m = fullMastery();
    m[L3.newKeys[3]!.id] = { correct: 2, total: 20 }; // 10 %
    const r = calculateCurriculumProgress(L3, m);
    expect(r.weakestKeyId).toBe(L3.newKeys[3]!.id);
    expect(r.weakestKeyAccuracy).toBe(10);
  });

  it('newKeys vide - percent 100, weakest null', () => {
    const r = calculateCurriculumProgress(L11, {});
    expect(r).toEqual({
      percent: 100,
      weakestKeyId: null,
      weakestKeyAccuracy: null,
    });
  });
});
