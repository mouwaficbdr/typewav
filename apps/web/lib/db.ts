/**
 * Couche d'accès IndexedDB — lib `idb`.
 * Spec : docs/ARCHITECTURE.md — IndexedDB via lib `idb`
 * Spec : docs/specs/02-diagnostic.md — Stockage IndexedDB
 *
 * 'use client' implicite — ce module ne doit être importé que depuis
 * des Client Components ou des hooks côté client.
 *
 * Stores :
 *   sessions          — SessionResult complet
 *   keystroke_stats   — agrégats par touche/bigram
 *   user_preferences  — préférences diverses
 *   user_profile      — profil et unlocks
 *   personal_records  — records personnels
 *   personal_texts    — textes personnalisés
 */

import type {
  KeystrokeEntry,
  PersonalRecords,
  SessionResult,
  UserProfile,
} from '@typewav/types';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

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

async function getDB(): Promise<IDBPDatabase<TypeWavDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TypeWavDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // sessions
      if (!db.objectStoreNames.contains('sessions')) {
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-timestamp', 'timestamp');
      }
      // keystroke_stats
      if (!db.objectStoreNames.contains('keystroke_stats')) {
        db.createObjectStore('keystroke_stats', { keyPath: 'key' });
      }
      // user_preferences
      if (!db.objectStoreNames.contains('user_preferences')) {
        db.createObjectStore('user_preferences');
      }
      // user_profile
      if (!db.objectStoreNames.contains('user_profile')) {
        db.createObjectStore('user_profile');
      }
      // personal_records
      if (!db.objectStoreNames.contains('personal_records')) {
        db.createObjectStore('personal_records');
      }
      // personal_texts
      if (!db.objectStoreNames.contains('personal_texts')) {
        const personalTexts = db.createObjectStore('personal_texts', {
          keyPath: 'id',
        });
        personalTexts.createIndex('by-createdAt', 'createdAt');
      }
    },
  });

  return dbInstance;
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
  unlockedThemes: ['terminal'],
  unlockedCollections: ['litterature'],
  unlockedMilestoneIds: [],
  currentRank: 'novice',
  pseudo: '',
};

export async function getUserProfile(): Promise<UserProfile> {
  const db = await getDB();
  const stored = await db.get('user_profile', 'profile');
  // Cloner : les appelants mutent le profil retourné avant de le
  // sauvegarder (voir useProgressionCheck) — sans clone, le premier
  // utilisateur sans profil enregistré corromprait DEFAULT_PROFILE pour
  // tous les appels suivants.
  return stored ?? (JSON.parse(JSON.stringify(DEFAULT_PROFILE)) as UserProfile);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('user_profile', profile, 'profile');
}

// ─── Records personnels ───────────────────────────────────────────────────────

export async function getPersonalRecords(): Promise<PersonalRecords | null> {
  const db = await getDB();
  return (await db.get('personal_records', 'records')) ?? null;
}

export async function savePersonalRecords(
  records: PersonalRecords,
): Promise<void> {
  const db = await getDB();
  await db.put('personal_records', records, 'records');
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
