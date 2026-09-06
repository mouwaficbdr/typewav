/**
 * Couche d'accès IndexedDB : lib `idb`.
 * Spec : docs/ARCHITECTURE.md (IndexedDB via lib `idb`)
 * Spec : docs/specs/02-diagnostic.md (Stockage IndexedDB)
 *
 * 'use client' implicite : ce module ne doit être importé que depuis
 * des Client Components ou des hooks côté client.
 *
 * Stores :
 *   sessions          : SessionResult complet
 *   keystroke_stats   : agrégats par touche/bigram
 *   user_preferences  : préférences diverses
 *   user_profile      : profil et unlocks
 *   personal_records  : records personnels
 *   personal_texts    : textes personnalisés
 */

import type {
  KeystrokeEntry,
  PersonalRecords,
  SessionResult,
  UserProfile,
} from '@typewav/types';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { updatePersonalRecords } from './progression';
import { calculateWpmWordLevel } from './stats';
import { BASE_UNLOCKED_THEME_IDS } from './theme/defaultThemes';

// ─── Types locaux DB ──────────────────────────────────────────────────────────

export interface PersonalText {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  lastUsed: number;
  isFavorite: boolean;
}

// ─── Schéma ────────────────────────────────────────────────────────────────────

interface TypeWavDB extends DBSchema {
  sessions: {
    key: string;
    value: SessionResult;
    indexes: { 'by-timestamp': number };
  };
  keystroke_stats: {
    key: string;
    value: KeystrokeAggregate;
  };
  user_preferences: {
    key: string;
    value: unknown;
  };
  user_profile: {
    key: string;
    value: UserProfile;
  };
  personal_records: {
    key: string;
    value: PersonalRecords;
  };
  personal_texts: {
    key: string;
    value: PersonalText;
    indexes: { 'by-createdAt': number };
  };
}

export interface KeystrokeAggregate {
  key: string;
  totalOccurrences: number;
  totalDeltaMs: number;
  avgDeltaMs: number;
  errorRate: number;
  lastUpdated: number;
}

// ─── Singleton DB ──────────────────────────────────────────────────────────────

const DB_NAME = 'typewav';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<TypeWavDB> | null = null;

/**
 * Échelle de migrations IndexedDB. Un palier `if (oldVersion < N)` par
 * incrément de DB_VERSION : il ne s'applique qu'aux clients qui n'ont pas
 * encore franchi la version N, et se limite à créer des stores et des index
 * (jamais de suppression ni de réécriture de données existantes). Chaque
 * palier est donc idempotent et sans perte, et les gardes `contains`
 * protègent le rejeu partiel.
 *
 * Historique :
 *   v1 : sessions (+ index by-timestamp), keystroke_stats, user_preferences
 *   v2 : user_profile, personal_records, personal_texts (+ index by-createdAt)
 *
 * Pour une v3 : ajouter `if (oldVersion < 3) { ... }` en fin de fonction et
 * incrémenter DB_VERSION.
 */
export function migrate(db: IDBPDatabase<TypeWavDB>, oldVersion: number): void {
  if (oldVersion < 1) {
    if (!db.objectStoreNames.contains('sessions')) {
      const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
      sessions.createIndex('by-timestamp', 'timestamp');
    }
    if (!db.objectStoreNames.contains('keystroke_stats')) {
      db.createObjectStore('keystroke_stats', { keyPath: 'key' });
    }
    if (!db.objectStoreNames.contains('user_preferences')) {
      db.createObjectStore('user_preferences');
    }
  }

  if (oldVersion < 2) {
    if (!db.objectStoreNames.contains('user_profile')) {
      db.createObjectStore('user_profile');
    }
    if (!db.objectStoreNames.contains('personal_records')) {
      db.createObjectStore('personal_records');
    }
    if (!db.objectStoreNames.contains('personal_texts')) {
      const personalTexts = db.createObjectStore('personal_texts', {
        keyPath: 'id',
      });
      personalTexts.createIndex('by-createdAt', 'createdAt');
    }
  }
}

/**
 * Local-first : demande au navigateur d'exempter cette origine de l'éviction
 * de stockage. Best effort, silencieux : l'app fonctionne sans, et l'API peut
 * être absente (vieux navigateur) ou refuser. Appelé une fois, à l'ouverture
 * de la DB.
 */
function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    // `navigator` indisponible (SSR, environnement de test) : on ignore.
  }
}

async function getDB(): Promise<IDBPDatabase<TypeWavDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TypeWavDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      migrate(db, oldVersion);
    },
    // Une autre connexion (autre onglet) monte en version, ou la base est en
    // cours de suppression : on libère la nôtre pour ne pas la bloquer, et on
    // force une réouverture propre au prochain accès.
    blocking() {
      dbInstance?.close();
      dbInstance = null;
    },
    terminated() {
      dbInstance = null;
    },
  });

  requestPersistentStorage();

  return dbInstance;
}

// ─── Migration ponctuelle du WPM (ticket #93, chantier 3) ────────────────────

const WPM_DEFINITION_MIGRATED_KEY = 'wpm_definition_migrated';

/**
 * Bascule une session enregistrée avant la redéfinition du WPM vers le
 * nouveau schéma : `wpm` devient le WPM word-level (Monkeytype) recalculé
 * depuis `keystrokeData`, et l'ancien `wpm` (qui était le brut « toutes les
 * frappes ») passe dans `wpmRaw`. Un éventuel `wpmNet` résiduel est retiré.
 *
 * Idempotente : une session portant déjà `wpmRaw` est rendue inchangée. Une
 * session sans `keystrokeData` exploitable (historique très ancien) garde son
 * `wpm` d'origine, seulement recopié dans `wpmRaw`, faute de pouvoir le
 * recalculer.
 */
export function migrateSessionWpmDefinition(
  session: SessionResult & { wpmRaw?: number; wpmNet?: number },
): SessionResult {
  const { wpmNet: _legacyNet, ...rest } = session;
  if (typeof rest.wpmRaw === 'number') {
    return rest as SessionResult;
  }
  const canRecompute = rest.keystrokeData.length > 0 && rest.duration > 0;
  return {
    ...(rest as SessionResult),
    wpmRaw: rest.wpm,
    wpm: canRecompute
      ? calculateWpmWordLevel(rest.keystrokeData, rest.duration)
      : rest.wpm,
  };
}

let wpmMigrationRun: Promise<void> | null = null;

/**
 * Recalcule une seule fois par session navigateur (drapeau persisté en plus)
 * tout l'historique et les records personnels sur la nouvelle définition du
 * WPM. Les readers qui exposent `wpm` ou les records l'attendent, donc
 * l'utilisateur ne voit jamais un chiffre à l'ancienne définition.
 *
 * Les records sont reconstruits depuis l'historique recalculé : accuracy,
 * régularité et durée sont inchangées, seuls maxWpm et byCollection basculent
 * sur le word-level. Un record dont la session source a été supprimée n'est
 * pas conservé, l'état canonique étant l'historique réel.
 */
async function ensureWpmDefinitionMigration(): Promise<void> {
  wpmMigrationRun ??= (async () => {
    try {
      const db = await getDB();
      const done = await db.get(
        'user_preferences',
        WPM_DEFINITION_MIGRATED_KEY,
      );
      if (done) return;

      const stored = (await db.getAll('sessions')) as Array<
        SessionResult & { wpmRaw?: number; wpmNet?: number }
      >;
      for (const s of stored) {
        const migrated = migrateSessionWpmDefinition(s);
        if (
          migrated.wpm !== s.wpm ||
          migrated.wpmRaw !== s.wpmRaw ||
          'wpmNet' in s
        ) {
          await db.put('sessions', migrated);
        }
      }

      const migratedSessions = (await db.getAll('sessions')) as SessionResult[];
      migratedSessions.sort((a, b) => a.timestamp - b.timestamp);
      let records: PersonalRecords | null = null;
      for (const s of migratedSessions) {
        records = updatePersonalRecords(records, s);
      }
      if (records) {
        await db.put('personal_records', records, 'records');
      }

      await db.put('user_preferences', true, WPM_DEFINITION_MIGRATED_KEY);
    } catch (err) {
      // Ne jamais bloquer l'accès DB sur un échec : le drapeau reste non
      // posé, la migration sera retentée au prochain chargement.
      wpmMigrationRun = null;
      console.error('[db] wpm definition migration failed', err);
    }
  })();
  return wpmMigrationRun;
}

// ─── Export / import de toutes les données (local-first) ─────────────────────

const ALL_STORES = [
  'sessions',
  'keystroke_stats',
  'user_preferences',
  'user_profile',
  'personal_records',
  'personal_texts',
] as const satisfies readonly (keyof TypeWavDB)[];

export interface DBExport {
  app: 'typewav';
  /** DB_VERSION au moment de l'export (chemin de migration v2). */
  version: number;
  exportedAt: number;
  /** Une entrée `{ key, value }` par enregistrement, par store. */
  stores: Record<string, Array<{ key: IDBValidKey; value: unknown }>>;
}

function isDBExport(v: unknown): v is DBExport {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (o['app'] !== 'typewav') return false;
  if (typeof o['stores'] !== 'object' || o['stores'] === null) return false;
  return Object.values(o['stores'] as Record<string, unknown>).every(
    (rows) =>
      Array.isArray(rows) &&
      rows.every(
        (r) => typeof r === 'object' && r !== null && 'key' in r && 'value' in r,
      ),
  );
}

/**
 * Sérialise tous les stores IndexedDB. La clé est conservée pour chaque
 * enregistrement (les stores `user_preferences` / `user_profile` /
 * `personal_records` ont des clés hors-ligne, non contenues dans la valeur).
 */
export async function exportAll(): Promise<DBExport> {
  await ensureWpmDefinitionMigration();
  const db = await getDB();
  const tx = db.transaction(ALL_STORES, 'readonly');
  const stores: DBExport['stores'] = {};
  for (const name of ALL_STORES) {
    const store = tx.objectStore(name);
    const [keys, values] = await Promise.all([
      store.getAllKeys(),
      store.getAll(),
    ]);
    stores[name] = keys.map((key, i) => ({ key, value: values[i] }));
  }
  await tx.done;
  return {
    app: 'typewav',
    version: DB_VERSION,
    exportedAt: Date.now(),
    stores,
  };
}

/**
 * Remplace toutes les données locales par celles de `data` (objet ou chaîne
 * JSON). Chaque store est vidé puis repeuplé ; un store absent du dump finit
 * vide. Tout dans une transaction : un import qui échoue ne laisse rien de
 * modifié.
 */
export async function importAll(data: unknown): Promise<void> {
  let parsed: unknown = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new Error('Fichier de données TypeWav illisible (JSON invalide).');
    }
  }
  if (!isDBExport(parsed)) {
    throw new Error("Ce fichier n'est pas un export de données TypeWav.");
  }

  const db = await getDB();
  const tx = db.transaction(ALL_STORES, 'readwrite');
  for (const name of ALL_STORES) {
    // `name` est un littéral de `ALL_STORES` mais la boucle en fait une union :
    // `idb` ne peut plus prouver la compatibilité value/store, d'où le cast.
    const store = tx.objectStore(name) as unknown as {
      keyPath: string | string[] | null;
      clear: () => Promise<void>;
      put: (value: unknown, key?: IDBValidKey) => Promise<IDBValidKey>;
    };
    await store.clear();
    for (const { key, value } of parsed.stores[name] ?? []) {
      if (store.keyPath == null) {
        await store.put(value, key);
      } else {
        await store.put(value);
      }
    }
  }
  await tx.done;

  // Les données viennent d'être remplacées : un export d'avant la
  // redéfinition du WPM doit pouvoir être re-migré au prochain accès.
  wpmMigrationRun = null;
}

// ─── Sérialisation des read-modify-write ──────────────────────────────────────

/**
 * File de promesses par store : chaîne les mutations d'un même store pour
 * qu'elles ne s'entrelacent jamais. Sans ça, deux `lecture puis écriture`
 * concurrents lisent la même valeur de départ et la seconde écriture écrase
 * la première (lost update).
 */
const _mutationQueues = new Map<string, Promise<unknown>>();

function enqueueMutation<T>(
  storeName: string,
  task: () => Promise<T>,
): Promise<T> {
  const pending = _mutationQueues.get(storeName) ?? Promise.resolve();
  const run = pending.then(task, task);
  // La queue ne doit jamais rester rejetée pour le maillon suivant ; l'appelant
  // récupère bien le rejet via `run`.
  _mutationQueues.set(
    storeName,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

// ─── Sessions ──────────────────────────────────────────────────────────────────

/**
 * Sauvegarde une session dans IndexedDB.
 * @returns L'ID de la session sauvegardée.
 */
export async function saveSession(session: SessionResult): Promise<string> {
  const db = await getDB();
  await db.put('sessions', session);
  return session.id;
}

/**
 * Récupère toutes les sessions triées par timestamp décroissant.
 */
export async function getSessions(): Promise<SessionResult[]> {
  await ensureWpmDefinitionMigration();
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'by-timestamp');
  return all.reverse();
}

/**
 * Récupère une session par son ID.
 */
export async function getSessionById(
  id: string,
): Promise<SessionResult | undefined> {
  await ensureWpmDefinitionMigration();
  const db = await getDB();
  return db.get('sessions', id);
}

/**
 * Supprime une session par son ID.
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

// ─── Keystroke stats ──────────────────────────────────────────────────────────

/**
 * Met à jour les agrégats de frappes après une session.
 * Calcule les moyennes sur l'ensemble de l'historique.
 */
export async function updateKeystrokeStats(
  keystrokes: KeystrokeEntry[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('keystroke_stats', 'readwrite');

  for (const entry of keystrokes) {
    if (entry.deltaMs <= 0) continue;
    const key = entry.char.toLowerCase();
    const existing = await tx.store.get(key);

    const current: KeystrokeAggregate = existing ?? {
      key,
      totalOccurrences: 0,
      totalDeltaMs: 0,
      avgDeltaMs: 0,
      errorRate: 0,
      lastUpdated: 0,
    };

    current.totalOccurrences += 1;
    current.totalDeltaMs += entry.deltaMs;
    current.avgDeltaMs = Math.round(
      current.totalDeltaMs / current.totalOccurrences,
    );
    // Mise à jour glissante du taux d'erreur (moyenne exponentielle, α=0.1)
    const newError = entry.correct ? 0 : 1;
    current.errorRate =
      Math.round((current.errorRate * 0.9 + newError * 0.1) * 100) / 100;
    current.lastUpdated = Date.now();

    await tx.store.put(current);
  }

  await tx.done;
}

/**
 * Récupère tous les agrégats de frappes.
 */
export async function getAllKeystrokeStats(): Promise<KeystrokeAggregate[]> {
  const db = await getDB();
  return db.getAll('keystroke_stats');
}

// ─── Préférences utilisateur ──────────────────────────────────────────────────

/**
 * Sauvegarde une préférence utilisateur.
 */
export async function setPreference<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('user_preferences', value, key);
}

/**
 * Récupère une préférence utilisateur.
 */
export async function getPreference<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get('user_preferences', key) as Promise<T | undefined>;
}

/**
 * Supprime une préférence utilisateur.
 */
export async function deletePreference(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('user_preferences', key);
}

// ─── Profil utilisateur ───────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  unlockedThemes: [...BASE_UNLOCKED_THEME_IDS],
  unlockedCollections: ['litterature'],
  currentRank: 'novice',
  pseudo: '',
};

export async function getUserProfile(): Promise<UserProfile> {
  const db = await getDB();
  const stored = await db.get('user_profile', 'profile');
  // Cloner : les appelants mutent le profil retourné avant de le
  // sauvegarder (voir useProgressionCheck) : sans clone, le premier
  // utilisateur sans profil enregistré corromprait DEFAULT_PROFILE pour
  // tous les appels suivants.
  return stored ?? (JSON.parse(JSON.stringify(DEFAULT_PROFILE)) as UserProfile);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('user_profile', profile, 'profile');
}

/**
 * Mutation atomique du profil : lecture et écriture dans la même transaction
 * readwrite, et sérialisation des appels concurrents via une file de
 * promesses. Deux `runAfterSession` qui s'enchaînent ne peuvent plus se
 * perdre un unlock mutuellement.
 *
 * `mutator` DOIT être synchrone (pas d'`await`) : un `await` entre le get et
 * le put ferme la transaction IndexedDB.
 */
export async function mutateUserProfile(
  mutator: (current: UserProfile) => UserProfile,
): Promise<UserProfile> {
  return enqueueMutation('user_profile', async () => {
    const db = await getDB();
    const tx = db.transaction('user_profile', 'readwrite');
    const stored = await tx.store.get('profile');
    const current =
      stored ?? (JSON.parse(JSON.stringify(DEFAULT_PROFILE)) as UserProfile);
    const updated = mutator(current);
    await tx.store.put(updated, 'profile');
    await tx.done;
    return updated;
  });
}

// ─── Records personnels ───────────────────────────────────────────────────────

export async function getPersonalRecords(): Promise<PersonalRecords | null> {
  await ensureWpmDefinitionMigration();
  const db = await getDB();
  return (await db.get('personal_records', 'records')) ?? null;
}

export async function savePersonalRecords(
  records: PersonalRecords,
): Promise<void> {
  const db = await getDB();
  await db.put('personal_records', records, 'records');
}

/**
 * Mutation atomique des records personnels, même contrat que
 * `mutateUserProfile` (transaction readwrite + file de promesses). `mutator`
 * reçoit `null` quand aucun record n'est encore enregistré.
 */
export async function mutatePersonalRecords(
  mutator: (current: PersonalRecords | null) => PersonalRecords,
): Promise<PersonalRecords> {
  return enqueueMutation('personal_records', async () => {
    // Le recalcul du WPM doit précéder toute nouvelle écriture de records,
    // sinon il écraserait celle-ci en reconstruisant depuis l'historique.
    await ensureWpmDefinitionMigration();
    const db = await getDB();
    const tx = db.transaction('personal_records', 'readwrite');
    const current = (await tx.store.get('records')) ?? null;
    const updated = mutator(current);
    await tx.store.put(updated, 'records');
    await tx.done;
    return updated;
  });
}

// ─── Textes personnels ────────────────────────────────────────────────────────

export async function savePersonalText(text: PersonalText): Promise<string> {
  const db = await getDB();
  await db.put('personal_texts', text);
  return text.id;
}

export async function getPersonalTexts(): Promise<PersonalText[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('personal_texts', 'by-createdAt');
  return all.reverse();
}

export async function deletePersonalText(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('personal_texts', id);
}
