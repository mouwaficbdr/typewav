import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { setPreference } from '../db';
import { loadMastery, saveMastery } from '../conservatoire/storage';

const T0 = new Date(2026, 9, 8, 10, 0, 0).getTime();

beforeEach(async () => {
  await setPreference('conservatoire_mastery', undefined);
});

describe('persistance de la maîtrise', () => {
  it('maîtrise vide et persistée quand rien n\'est sauvegardé', async () => {
    expect(await loadMastery()).toEqual({ mastery: {}, persisted: true });
  });

  it('save puis load fait l\'aller-retour', async () => {
    const mastery = {
      e: { attempts: [{ correct: true, latencyMs: 300, at: T0 }], lastSeenAt: T0, reviewStep: 1 },
    };
    expect(await saveMastery(mastery)).toBe(true);
    expect(await loadMastery()).toEqual({ mastery, persisted: true });
  });

  it('une sauvegarde corrompue se charge comme une maîtrise propre', async () => {
    await setPreference('conservatoire_mastery', {
      e: { attempts: 'pas un tableau', lastSeenAt: T0, reviewStep: 0 },
      a: { attempts: [{ correct: 'oui', at: T0 }, { correct: true, latencyMs: null, at: T0 }], lastSeenAt: T0, reviewStep: 0 },
      s: null,
    });
    expect(await loadMastery()).toEqual({
      mastery: { a: { attempts: [{ correct: true, latencyMs: null, at: T0 }], lastSeenAt: T0, reviewStep: 0 } },
      persisted: true,
    });
  });

  it('une valeur qui n\'est pas un objet donne une maîtrise vide', async () => {
    await setPreference('conservatoire_mastery', [1, 2, 3]);
    expect((await loadMastery()).mastery).toEqual({});
  });

  it('une sauvegarde de plus de 30 tentatives est tronquée aux 30 dernières', async () => {
    const attempts = Array.from({ length: 40 }, (_, i) => ({ correct: true, latencyMs: null, at: T0 + i }));
    await setPreference('conservatoire_mastery', { e: { attempts, lastSeenAt: T0 + 39, reviewStep: 0 } });
    const { mastery } = await loadMastery();
    expect(mastery.e?.attempts).toHaveLength(30);
    expect(mastery.e?.attempts[0]?.at).toBe(T0 + 10);
  });
});
