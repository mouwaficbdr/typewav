/**
 * Migration ponctuelle du WPM (ticket #93, chantier 3) : les sessions et
 * records enregistrés avant la redéfinition portaient un `wpm` = brut (toutes
 * les frappes). On les bascule vers `wpm` = word-level (Monkeytype) recalculé
 * depuis `keystrokeData`, l'ancien brut allant dans `wpmRaw`, puis on
 * reconstruit les records personnels depuis l'historique recalculé.
 */
import type { KeystrokeEntry, SessionResult } from '@typewav/types';
import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getPersonalRecords,
  getPreference,
  getSessions,
  migrate,
  migrateSessionWpmDefinition,
} from '../db';
import { calculateWpmWordLevel } from '../stats';

const DB_NAME = 'typewav';
const FLAG = 'wpm_definition_migrated';

function wordKs(
  text: string,
  { wrongAt = [] as number[], intervalMs = 200 } = {},
): KeystrokeEntry[] {
  const wrong = new Set(wrongAt);
  return text.split('').map((char, i) => ({
    char,
    timestamp: 1_000 + i * intervalMs,
    correct: !wrong.has(i),
    deltaMs: i === 0 ? 0 : intervalMs,
  }));
}

/** Session au vieux schéma : `wpm` = brut, aucun `wpmRaw`. */
function oldSession(
  id: string,
  wpmGross: number,
  keystrokeData: KeystrokeEntry[],
  extra: Partial<SessionResult> = {},
): Record<string, unknown> {
  return {
    id,
    timestamp: Date.now(),
    wpm: wpmGross,
    accuracy: 95,
    consistency: 85,
    duration: 30_000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData,
    ...extra,
  };
}

beforeEach(async () => {
  await deleteDB(DB_NAME);
});
afterEach(async () => {
  await deleteDB(DB_NAME);
});

describe('migrateSessionWpmDefinition (unité)', () => {
  it('déplace l’ancien wpm brut dans wpmRaw et recalcule wpm en word-level', () => {
    const ks = wordKs('the cat sat');
    const migrated = migrateSessionWpmDefinition(
      oldSession('s1', 91, ks) as unknown as SessionResult,
    );
    expect(migrated.wpmRaw).toBe(91);
    expect(migrated.wpm).toBe(calculateWpmWordLevel(ks, 30_000));
  });

  it('est idempotente : une session portant déjà wpmRaw est rendue telle quelle', () => {
    const ks = wordKs('the cat sat');
    const already = {
      ...oldSession('s1', 91, ks),
      wpm: 7,
      wpmRaw: 91,
    } as unknown as SessionResult;
    const migrated = migrateSessionWpmDefinition(already);
    expect(migrated.wpm).toBe(7);
    expect(migrated.wpmRaw).toBe(91);
  });

  it('sans keystrokeData exploitable, garde le wpm d’origine (recopié dans wpmRaw)', () => {
    const migrated = migrateSessionWpmDefinition(
      oldSession('s1', 55, []) as unknown as SessionResult,
    );
    expect(migrated.wpm).toBe(55);
    expect(migrated.wpmRaw).toBe(55);
  });

  it('retire un champ wpmNet résiduel', () => {
    const migrated = migrateSessionWpmDefinition({
      ...oldSession('s1', 60, wordKs('the cat')),
      wpmNet: 57,
    } as unknown as SessionResult);
    expect('wpmNet' in migrated).toBe(false);
  });
});

describe('migration au premier accès (getSessions / getPersonalRecords)', () => {
  // Un seul cas : le singleton de connexion et le drapeau `wpmMigrationRun`
  // de db.ts sont au niveau module (persistent d'un `it` à l'autre dans le
  // même fichier), donc on seed une fois et on enchaîne les assertions.
  it('bascule sessions et records au premier accès, pose le drapeau, puis reste idempotente', async () => {
    const ksFast = wordKs('the cat sat there today');
    const ksSloppy = wordKs('the cat sat there today', { wrongAt: [4] });

    const seed = await openDB(DB_NAME, 2, { upgrade: migrate });
    await seed.put(
      'sessions',
      oldSession('fast', 88, ksFast, { timestamp: 1 }) as never,
    );
    await seed.put(
      'sessions',
      oldSession('sloppy', 130, ksSloppy, { timestamp: 2 }) as never,
    );
    seed.close();

    // Premier accès : la migration bascule chaque session.
    const sessions = await getSessions();
    const byId = Object.fromEntries(sessions.map((s) => [s.id, s]));

    expect(byId['fast']!.wpmRaw).toBe(88);
    expect(byId['fast']!.wpm).toBe(calculateWpmWordLevel(ksFast, 30_000));
    expect(byId['sloppy']!.wpmRaw).toBe(130);
    expect(byId['sloppy']!.wpm).toBe(calculateWpmWordLevel(ksSloppy, 30_000));

    // Drapeau posé.
    expect(await getPreference(FLAG)).toBe(true);

    // Records reconstruits sur le word-level recalculé.
    const records = await getPersonalRecords();
    const expectedMax = Math.max(
      calculateWpmWordLevel(ksFast, 30_000),
      calculateWpmWordLevel(ksSloppy, 30_000),
    );
    expect(records?.maxWpm.value).toBe(expectedMax);

    // Second accès : rien n'est re-décalé.
    const again = Object.fromEntries(
      (await getSessions()).map((s) => [s.id, s]),
    );
    expect(again['fast']!.wpm).toBe(byId['fast']!.wpm);
    expect(again['fast']!.wpmRaw).toBe(88);
  });
});
