import { describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({
  setPreference: vi.fn(async () => {
    throw new Error('IndexedDB indisponible');
  }),
}));

import { saveProfile } from '../conservatoire/profile';

describe('profil en échec', () => {
  it('écriture impossible : false, aucune exception', async () => {
    await expect(
      saveProfile({
        version: 1,
        startedAt: 1,
        experience: null,
        dailyMinutes: null,
        placement: null,
        outcome: null,
        skipped: true,
      }),
    ).resolves.toBe(false);
  });
});
