import type { MidiPiece } from '@typewav/audio-engine';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface MidiPieceCacheEntry {
  cacheVersion: string;
  piece: MidiPiece;
  savedAt: number;
}

interface MidiPieceCacheDB extends DBSchema {
  parsed_midi_pieces: {
    key: string;
    value: MidiPieceCacheEntry;
  };
}

const DB_NAME = 'typewav-midi-cache';
const DB_VERSION = 1;
const STORE_NAME = 'parsed_midi_pieces';

const memoryCache = new Map<string, MidiPieceCacheEntry>();
let dbPromise: Promise<IDBPDatabase<MidiPieceCacheDB> | null> | null = null;

function hasIndexedDb(): boolean {
  return typeof globalThis !== 'undefined' && 'indexedDB' in globalThis;
}

async function getPersistentDb(): Promise<IDBPDatabase<MidiPieceCacheDB> | null> {
  if (!hasIndexedDb()) return null;
  if (dbPromise) return dbPromise;

  dbPromise = openDB<MidiPieceCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  }).catch(() => null);

  return dbPromise;
}

export async function getCachedMidiPiece(
  pieceId: string,
  cacheVersion: string,
): Promise<MidiPiece | null> {
  const memoryEntry = memoryCache.get(pieceId);
  if (memoryEntry?.cacheVersion === cacheVersion) {
    return memoryEntry.piece;
  }

  const db = await getPersistentDb();
  if (!db) return null;

  try {
    const stored = await db.get(STORE_NAME, pieceId);
    if (!stored) return null;

    if (stored.cacheVersion !== cacheVersion) {
      await db.delete(STORE_NAME, pieceId);
      return null;
    }

    memoryCache.set(pieceId, stored);
    return stored.piece;
  } catch {
    return null;
  }
}

export async function setCachedMidiPiece(
  pieceId: string,
  cacheVersion: string,
  piece: MidiPiece,
): Promise<void> {
  const entry: MidiPieceCacheEntry = {
    cacheVersion,
    piece,
    savedAt: Date.now(),
  };

  memoryCache.set(pieceId, entry);

  const db = await getPersistentDb();
  if (!db) return;

  try {
    await db.put(STORE_NAME, entry, pieceId);
  } catch {
    // Le cache persistant est best-effort, le cache mémoire suffit en fallback.
  }
}

export function clearInMemoryMidiPieceCache(): void {
  memoryCache.clear();
}
