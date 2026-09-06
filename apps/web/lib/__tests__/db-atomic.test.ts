/**
 * Mutations atomiques du profil et des records personnels.
 *
 * Les anciens `getUserProfile()` … `saveUserProfile()` faisaient un
 * read-modify-write non atomique : deux mises à jour concurrentes se
 * perdaient. `mutateUserProfile` / `mutatePersonalRecords` sérialisent les
 * mutations d'un même store (file de promesses + transaction readwrite
 * lecture+écriture).
 */
import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getPersonalRecords,
  getUserProfile,
  mutatePersonalRecords,
  mutateUserProfile,
} from '../db';

beforeEach(async () => {
  await deleteDB('typewav');
});
afterEach(async () => {
  await deleteDB('typewav');
});

describe('mutateUserProfile', () => {
  it('applique le mutateur et persiste le résultat', async () => {
    const updated = await mutateUserProfile((p) => ({ ...p, pseudo: 'neo' }));

    expect(updated.pseudo).toBe('neo');
    expect((await getUserProfile()).pseudo).toBe('neo');
  });

  it('N mutations concurrentes : aucune écriture perdue (+N exact)', async () => {
    const before = (await getUserProfile()).unlockedThemes.length;
    const N = 25;

    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        mutateUserProfile((p) => ({
          ...p,
          unlockedThemes: [...p.unlockedThemes, `t-${i}`],
        })),
      ),
    );

    const after = (await getUserProfile()).unlockedThemes.length;
    expect(after - before).toBe(N);
  });
});

describe('mutatePersonalRecords', () => {
  it('seed depuis null puis persiste', async () => {
    const updated = await mutatePersonalRecords((current) => {
      const base =
        current ??
        ({
          maxWpm: { value: 0, sessionId: '', achievedAt: 0 },
          maxAccuracy: { value: 0, sessionId: '', achievedAt: 0 },
          maxConsistency: { value: 0, sessionId: '', achievedAt: 0 },
          longestSession: { duration: 0, sessionId: '', achievedAt: 0 },
          byCollection: {},
        } satisfies import('@typewav/types').PersonalRecords);
      return { ...base, maxWpm: { value: 99, sessionId: 's', achievedAt: 1 } };
    });

    expect(updated.maxWpm.value).toBe(99);
    expect((await getPersonalRecords())?.maxWpm.value).toBe(99);
  });

  it('N ajouts concurrents de collections distinctes : les N sont présents', async () => {
    const N = 25;

    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        mutatePersonalRecords((current) => {
          const base =
            current ??
            ({
              maxWpm: { value: 0, sessionId: '', achievedAt: 0 },
              maxAccuracy: { value: 0, sessionId: '', achievedAt: 0 },
              maxConsistency: { value: 0, sessionId: '', achievedAt: 0 },
              longestSession: { duration: 0, sessionId: '', achievedAt: 0 },
              byCollection: {},
            } satisfies import('@typewav/types').PersonalRecords);
          return {
            ...base,
            byCollection: {
              ...base.byCollection,
              [`c-${i}`]: { wpm: i, achievedAt: i },
            },
          };
        }),
      ),
    );

    const final = await getPersonalRecords();
    expect(Object.keys(final?.byCollection ?? {})).toHaveLength(N);
  });
});
