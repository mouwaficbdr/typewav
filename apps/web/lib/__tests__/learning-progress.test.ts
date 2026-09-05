import type { LearningLevel } from '@typewav/types';
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  applySessionStats,
  calculateProgressPercent,
  canUnlockNextLevel,
  createInitialLevelProgress,
  loadLearningProgress,
  saveLearningProgress,
} from '../learning-progress';

const LEVEL: LearningLevel = {
  id: 1,
  name: 'Home Row',
  keys: ['a', 's'],
  minAccuracy: 90,
  minSamples: 50,
};

describe('createInitialLevelProgress', () => {
  it('déverrouille uniquement le niveau 1', () => {
    const levels: LearningLevel[] = [
      { ...LEVEL, id: 1 },
      { ...LEVEL, id: 2 },
    ];
    const progress = createInitialLevelProgress(levels);
    expect(progress.find((p) => p.levelId === 1)?.unlocked).toBe(true);
    expect(progress.find((p) => p.levelId === 2)?.unlocked).toBe(false);
  });
});

describe('calculateProgressPercent', () => {
  it('retourne 0 sans frappes', () => {
    expect(
      calculateProgressPercent({ levelId: 1, samples: 0, accuracy: 0, unlocked: true }, LEVEL),
    ).toBe(0);
  });

  it("reflète le facteur limitant (samples), pas seulement l'accuracy", () => {
    // Précision déjà à la cible (100% de 90 requis), mais seulement 10% des frappes requises.
    const percent = calculateProgressPercent(
      { levelId: 1, samples: 5, accuracy: 100, unlocked: true },
      LEVEL,
    );
    // 5/50 = 10% de frappes vs 100/90 = 111% d'accuracy : le facteur limitant est 10%.
    expect(percent).toBe(10);
  });

  it("reflète le facteur limitant (accuracy) quand les frappes sont déjà suffisantes", () => {
    const percent = calculateProgressPercent(
      { levelId: 1, samples: 50, accuracy: 45, unlocked: true },
      LEVEL,
    );
    // 50/50 = 100% de frappes vs 45/90 = 50% d'accuracy : le facteur limitant est 50%.
    expect(percent).toBe(50);
  });

  it('retourne 100 quand les deux critères sont atteints', () => {
    const percent = calculateProgressPercent(
      { levelId: 1, samples: 50, accuracy: 90, unlocked: true },
      LEVEL,
    );
    expect(percent).toBe(100);
  });
});

describe('canUnlockNextLevel', () => {
  it('faux si les frappes sont insuffisantes malgré une bonne précision', () => {
    expect(
      canUnlockNextLevel({ levelId: 1, samples: 10, accuracy: 100, unlocked: true }, LEVEL),
    ).toBe(false);
  });

  it("faux si la précision est insuffisante malgré assez de frappes", () => {
    expect(
      canUnlockNextLevel({ levelId: 1, samples: 60, accuracy: 50, unlocked: true }, LEVEL),
    ).toBe(false);
  });

  it('vrai quand les deux critères sont atteints', () => {
    expect(
      canUnlockNextLevel({ levelId: 1, samples: 60, accuracy: 95, unlocked: true }, LEVEL),
    ).toBe(true);
  });
});

describe('applySessionStats', () => {
  it("accumule samples et recalcule l'accuracy pondérée pour le bon niveau", () => {
    const initial = createInitialLevelProgress([LEVEL, { ...LEVEL, id: 2 }]);
    const updated = applySessionStats(initial, 1, { correct: 8, total: 10 });

    const level1 = updated.find((p) => p.levelId === 1)!;
    expect(level1.samples).toBe(10);
    expect(level1.accuracy).toBe(80);

    // Le niveau 2 n'est pas affecté.
    const level2 = updated.find((p) => p.levelId === 2)!;
    expect(level2.samples).toBe(0);
  });

  it('pondère correctement sur plusieurs sessions successives', () => {
    let progress = createInitialLevelProgress([LEVEL]);
    progress = applySessionStats(progress, 1, { correct: 8, total: 10 }); // 80%
    progress = applySessionStats(progress, 1, { correct: 10, total: 10 }); // +100%

    const level1 = progress.find((p) => p.levelId === 1)!;
    expect(level1.samples).toBe(20);
    // (8 + 10) / 20 = 90%
    expect(level1.accuracy).toBe(90);
  });
});

describe('loadLearningProgress / saveLearningProgress', () => {
  it('retourne undefined avant toute sauvegarde', async () => {
    const loaded = await loadLearningProgress();
    expect(loaded).toBeUndefined();
  });

  it('persiste et recharge la progression exacte', async () => {
    const progress = createInitialLevelProgress([LEVEL, { ...LEVEL, id: 2 }]);
    const updated = applySessionStats(progress, 1, { correct: 45, total: 50 });

    await saveLearningProgress(updated);
    const loaded = await loadLearningProgress();

    expect(loaded).toEqual(updated);
  });
});
