import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getPreference, setPreference } from '../db';
import {
  ensureCurriculumVersion,
  loadKeyMastery,
  loadTaughtLevels,
  saveKeyMastery,
  saveTaughtLevels,
} from '../learning-progress';
import { CURRICULUM_VERSION } from '@typewav/types';

beforeEach(async () => {
  await setPreference('learning_curriculum_version', undefined);
  await setPreference('learning_key_mastery', undefined);
  await setPreference('learning_taught_levels', undefined);
  await setPreference('learning_level_progress', undefined);
});

describe('persistance curriculum', () => {
  it('loadKeyMastery retourne {} quand rien n\'est sauvegarde', async () => {
    expect(await loadKeyMastery()).toEqual({});
  });

  it('save puis load round-trip la maitrise', async () => {
    await saveKeyMastery({ e: { correct: 3, total: 4 } });
    expect(await loadKeyMastery()).toEqual({ e: { correct: 3, total: 4 } });
  });

  it('loadTaughtLevels round-trip', async () => {
    expect(await loadTaughtLevels()).toEqual([]);
    await saveTaughtLevels([1, 2, 3]);
    expect(await loadTaughtLevels()).toEqual([1, 2, 3]);
  });

  it('ensureCurriculumVersion reset tout si la version differe', async () => {
    await saveKeyMastery({ e: { correct: 9, total: 9 } });
    await saveTaughtLevels([1, 2, 3, 4]);
    await setPreference('learning_level_progress', [{ levelId: 99, accuracy: 100, samples: 100, unlocked: true }]);

    await ensureCurriculumVersion();

    expect(await getPreference('learning_curriculum_version')).toBe(CURRICULUM_VERSION);
    expect(await loadKeyMastery()).toEqual({});
    expect(await loadTaughtLevels()).toEqual([]);
    const progress = (await getPreference('learning_level_progress')) as { levelId: number }[];
    expect(progress.map((p) => p.levelId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('ensureCurriculumVersion ne touche a rien si la version est a jour', async () => {
    await setPreference('learning_curriculum_version', CURRICULUM_VERSION);
    await saveKeyMastery({ e: { correct: 9, total: 9 } });
    await ensureCurriculumVersion();
    expect(await loadKeyMastery()).toEqual({ e: { correct: 9, total: 9 } });
  });
});
