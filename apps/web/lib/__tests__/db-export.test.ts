/**
 * Local-first : export / import de toutes les données IndexedDB.
 * "Télécharger mes données" (JSON) et "Importer" (remplace depuis ce JSON).
 * Sert aussi de chemin de migration vers une v2.
 */
import type { SessionResult } from '@typewav/types';
import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  deleteSession,
  exportAll,
  getPersonalTexts,
  getPreference,
  getSessions,
  importAll,
  saveSession,
  savePersonalText,
  saveUserProfile,
  setPreference,
} from '../db';

beforeEach(async () => {
  await deleteDB('typewav');
});
afterEach(async () => {
  await deleteDB('typewav');
});

function makeSession(id: string): SessionResult {
  return {
    id,
    timestamp: 1_700_000_000_000,
    wpm: 80,
    wpmRaw: 82,
    accuracy: 97,
    consistency: 90,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: [],
  };
}

describe('exportAll', () => {
  it('renvoie une enveloppe avec les 6 stores', async () => {
    const dump = await exportAll();

    expect(dump.app).toBe('typewav');
    expect(typeof dump.version).toBe('number');
    expect(typeof dump.exportedAt).toBe('number');
    expect(Object.keys(dump.stores).sort()).toEqual(
      [
        'sessions',
        'keystroke_stats',
        'user_preferences',
        'user_profile',
        'personal_records',
        'personal_texts',
      ].sort(),
    );
  });

  it('capture les données seedées, clé comprise pour les stores hors-ligne', async () => {
    await saveSession(makeSession('s1'));
    await setPreference('volume', 0.7);
    await saveUserProfile({
      unlockedThemes: ['terminal'],
      unlockedCollections: ['litterature'],
      currentRank: 'novice',
      pseudo: 'Ada',
    });

    const dump = await exportAll();

    expect(dump.stores.sessions).toHaveLength(1);
    expect(dump.stores.sessions![0]!.value).toMatchObject({ id: 's1', wpm: 80 });
    expect(dump.stores.user_preferences).toContainEqual({
      key: 'volume',
      value: 0.7,
    });
    expect(dump.stores.user_profile![0]).toEqual({
      key: 'profile',
      value: expect.objectContaining({ pseudo: 'Ada' }),
    });
  });
});

describe('importAll', () => {
  it('round-trip : export, tout modifier, import restaure le dump', async () => {
    await saveSession(makeSession('keep-1'));
    await setPreference('lang', 'fr');

    const dump = await exportAll();

    await deleteSession('keep-1');
    await setPreference('lang', 'en');
    await saveSession(makeSession('added-after'));

    await importAll(dump);

    expect((await getSessions()).map((s) => s.id)).toEqual(['keep-1']);
    expect(await getPreference('lang')).toBe('fr');
  });

  it('accepte une chaîne JSON', async () => {
    await saveSession(makeSession('json-str'));
    const json = JSON.stringify(await exportAll());

    await deleteSession('json-str');
    await importAll(json);

    expect((await getSessions()).map((s) => s.id)).toEqual(['json-str']);
  });

  it('remplace : un store absent du dump est vidé', async () => {
    await savePersonalText({
      id: 't1',
      title: 'x',
      content: 'y',
      createdAt: 1,
      lastUsed: 1,
      isFavorite: false,
    });

    const dump = await exportAll();
    delete (dump.stores as Record<string, unknown>)['personal_texts'];

    await importAll(dump);

    expect(await getPersonalTexts()).toEqual([]);
  });

  it("rejette un JSON qui n'est pas un export TypeWav", async () => {
    await expect(importAll('{"nope":true}')).rejects.toThrow();
    await expect(importAll('pas du json')).rejects.toThrow();
    await expect(
      importAll({ app: 'autre-chose', stores: {} }),
    ).rejects.toThrow();
  });
});
