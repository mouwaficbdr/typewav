/**
 * Couche d'accès IndexedDB — lib `idb`.
 * Spec : docs/ARCHITECTURE.md — IndexedDB via lib `idb`
 * Spec : docs/specs/02-diagnostic.md — Stockage IndexedDB
 *
 * 'use client' implicite — ce module ne doit être importé que depuis
 * des Client Components ou des hooks côté client.
 *
 * Stores :
 *   sessions        — SessionResult complet
 *   keystroke_stats — agrégats par touche/bigram (mis à jour après chaque session)
 */

import type { KeystrokeEntry, SessionResult } from '@typewav/types';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ─── Schéma ────────────────────────────────────────────────────────────────────

interface TypeWavDB extends DBSchema {
  sessions: {
    key: string;
    value: SessionResult;
    indexes: {
      'by-timestamp': number;
    };
  };
  keystroke_stats: {
    key: string; // char ou bigram
    value: KeystrokeAggregate;
  };
  user_preferences: {
    key: string;
    value: unknown;
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
const DB_VERSION = 1;

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
