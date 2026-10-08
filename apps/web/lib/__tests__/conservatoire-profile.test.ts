import 'fake-indexeddb/auto';
import type { ConservatoireProfile } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import { getPreference } from '../db';
import { placementOutcome, saveProfile } from '../conservatoire/profile';

describe('placementOutcome', () => {
  it('« Je débute » : la leçon 1, quel que soit le score', () => {
    expect(placementOutcome('beginner', null)).toBe('lesson1');
    expect(placementOutcome('beginner', { wpm: 80, accuracy: 99 })).toBe('lesson1');
  });

  it('« Avec quelques doigts » : la leçon 1 en parcours accéléré', () => {
    expect(placementOutcome('some-fingers', { wpm: 80, accuracy: 99 })).toBe('lesson1-fast');
  });

  it('« Sans regarder » : cycle 1 validé à partir de 30 MPM et 95 %, bornes incluses', () => {
    expect(placementOutcome('touch-typist', { wpm: 30, accuracy: 95 })).toBe('cycle1-validated');
    expect(placementOutcome('touch-typist', { wpm: 29, accuracy: 99 })).toBe('lesson1-fast');
    expect(placementOutcome('touch-typist', { wpm: 60, accuracy: 94 })).toBe('lesson1-fast');
    expect(placementOutcome('touch-typist', null)).toBe('lesson1-fast');
  });
});

describe('saveProfile', () => {
  it('écrit le profil sous conservatoire_profile', async () => {
    const profile: ConservatoireProfile = {
      version: 1,
      startedAt: 1,
      experience: 'beginner',
      dailyMinutes: 10,
      placement: null,
      outcome: 'lesson1',
      skipped: false,
    };
    await expect(saveProfile(profile)).resolves.toBe(true);
    await expect(getPreference('conservatoire_profile')).resolves.toEqual(profile);
  });
});
