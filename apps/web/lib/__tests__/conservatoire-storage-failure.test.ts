import { describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({
  getPreference: vi.fn(async () => {
    throw new Error('IndexedDB indisponible');
  }),
  setPreference: vi.fn(async () => {
    throw new Error('IndexedDB indisponible');
  }),
}));

import { loadMastery, saveMastery } from '../conservatoire/storage';

describe('persistance de la maîtrise en échec', () => {
  it('lecture impossible : maîtrise vide, non persistée, aucune exception', async () => {
    await expect(loadMastery()).resolves.toEqual({ mastery: {}, persisted: false });
  });

  it('écriture impossible : false, aucune exception', async () => {
    await expect(saveMastery({})).resolves.toBe(false);
  });
});
