/**
 * Tests de l'échelle de migrations IndexedDB (fonction `migrate` de db.ts).
 * Chaque palier de version doit être idempotent et sans perte de données.
 */
import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../db';

const DB_NAME = 'typewav';

const V1_STORES = ['sessions', 'keystroke_stats', 'user_preferences'] as const;
const V2_STORES = [
  ...V1_STORES,
  'user_profile',
  'personal_records',
  'personal_texts',
] as const;

beforeEach(async () => {
  await deleteDB(DB_NAME);
});
afterEach(async () => {
  await deleteDB(DB_NAME);
});

describe('migrate', () => {
  it('installation fraîche (oldVersion 0 → 2) crée les 6 stores et leurs index', async () => {
    const db = await openDB(DB_NAME, 2, { upgrade: migrate });

    expect([...db.objectStoreNames].sort()).toEqual([...V2_STORES].sort());
    expect([...db.transaction('sessions').store.indexNames]).toContain(
      'by-timestamp',
    );
    expect([...db.transaction('personal_texts').store.indexNames]).toContain(
      'by-createdAt',
    );

    db.close();
  });

  it('v1 → v2 ajoute les stores v2 sans toucher aux données v1', async () => {
    // DB telle qu'elle existait en v1 (réplique historique fidèle).
    const v1 = await openDB(DB_NAME, 1, {
      upgrade(db) {
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-timestamp', 'timestamp');
        db.createObjectStore('keystroke_stats', { keyPath: 'key' });
        db.createObjectStore('user_preferences');
      },
    });
    await v1.put('sessions', { id: 's1', timestamp: 42 } as never);
    v1.close();

    const v2 = await openDB(DB_NAME, 2, { upgrade: migrate });

    expect([...v2.objectStoreNames].sort()).toEqual([...V2_STORES].sort());
    // Donnée écrite en v1 toujours là après la migration.
    expect(await v2.get('sessions', 's1')).toMatchObject({ id: 's1' });

    v2.close();
  });

  it('v2 → v2 : ré-ouverture sans changement de version ne rejoue aucune migration', async () => {
    const first = await openDB(DB_NAME, 2, { upgrade: migrate });
    first.close();

    const spy = vi.fn(migrate);
    const second = await openDB(DB_NAME, 2, { upgrade: spy });

    expect(spy).not.toHaveBeenCalled();
    second.close();
  });
});
