/**
 * fetch.ts — sélection contextuelle de textes depuis une collection.
 *
 * API haut niveau : filtre par langue, longueur, durée et difficulté.
 * Anti-deadlock : si le pool filtré est vide après exclusions, élargit
 * progressivement jusqu'à retourner un texte (jamais null sur collection non vide).
 *
 * Spec : docs/specs/34-collections-refonte.md — Phase 2
 */

import type { TextEntry, TypingMode } from '@typewav/types';
import type { CollectionId } from './index';
import {
  codeCollection,
  gamingCollection,
  litteratureCollection,
  philosophieCollection,
  poesieCollection,
} from './index';

export interface FetchOptions {
  /** Filtre sur la langue. undefined = pas de filtre (FR+EN) */
  language?: 'fr' | 'en';
  /** Mode typing — informatif, non utilisé directement dans le filtrage */
  mode?: TypingMode;
  /** Pour mode Mots — nombre de mots demandés */
  wordCount?: 10 | 25 | 50 | 100;
  /** Pour mode Temps — durée en secondes */
  durationSeconds?: 15 | 30 | 60 | 120;
  /** Filtre de difficulté exacte */
  difficulty?: 1 | 2 | 3 | 4 | 5;
  /** Difficulté min (inclusive) */
  difficultyMin?: 1 | 2 | 3 | 4 | 5;
  /** IDs à exclure — éviter les doublons récents */
  excludeIds?: string[];
}

const WORD_COUNT_RANGES: Record<number, [number, number]> = {
  10: [5, 15],
  25: [20, 35],
  50: [40, 65],
  100: [80, 130],
};

const CHARS_PER_SECOND = 3.5;
const DURATION_TOLERANCE = 0.4; // ±40%

const COLLECTION_MAP: Record<CollectionId, { texts: TextEntry[] }> = {
  litterature: litteratureCollection,
  poesie: poesieCollection,
  philosophie: philosophieCollection,
  gaming: gamingCollection,
  code: codeCollection,
};

/**
 * Retourne un texte aléatoire depuis une collection, filtré selon les options.
 *
 * Ne retourne jamais null si la collection n'est pas vide.
 * Si les filtres réduisent le pool à zéro, ils sont relâchés progressivement.
 */
export function fetchCollection(
  collectionId: CollectionId,
  options: FetchOptions = {},
): TextEntry | null {
  const allTexts = COLLECTION_MAP[collectionId].texts;
  if (allTexts.length === 0) return null;

  let pool = _applyFilters(allTexts, options);

  // Relâchement 1 : si pool vide, essayer sans filtre de longueur
  if (pool.length === 0) {
    const opts: FetchOptions = {};
    if (options.language) opts.language = options.language;
    if (options.difficulty !== undefined) opts.difficulty = options.difficulty;
    if (options.difficultyMin !== undefined) opts.difficultyMin = options.difficultyMin;
    if (options.excludeIds) opts.excludeIds = options.excludeIds;
    pool = _applyFilters(allTexts, opts);
  }

  // Relâchement 2 : si encore vide, essayer seulement langue + exclusions
  if (pool.length === 0) {
    const opts: FetchOptions = {};
    if (options.language) opts.language = options.language;
    if (options.excludeIds) opts.excludeIds = options.excludeIds;
    pool = _applyFilters(allTexts, opts);
  }

  // Fallback total : toute la collection
  if (pool.length === 0) {
    pool = allTexts;
  }

  return pool[Math.floor(Math.random() * pool.length)]!;
}

/**
 * Retourne le pool complet filtré (sans sélection aléatoire).
 */
export function fetchPool(
  collectionId: CollectionId,
  options: FetchOptions = {},
): TextEntry[] {
  const allTexts = COLLECTION_MAP[collectionId].texts;
  return _applyFilters(allTexts, options);
}

function _applyFilters(texts: TextEntry[], options: FetchOptions): TextEntry[] {
  let pool = texts;

  // Filtre langue
  if (options.language) {
    const lang = options.language;
    pool = pool.filter((t) => t.language === lang);
  }

  // Filtre wordCount
  if (options.wordCount !== undefined) {
    const range = WORD_COUNT_RANGES[options.wordCount];
    if (range) {
      const [min, max] = range;
      pool = pool.filter((t) => t.wordCount >= min && t.wordCount <= max);
    }
  }

  // Filtre durationSeconds
  if (options.durationSeconds !== undefined) {
    const targetChars = options.durationSeconds * CHARS_PER_SECOND;
    const min = targetChars * (1 - DURATION_TOLERANCE);
    const max = targetChars * (1 + DURATION_TOLERANCE);
    pool = pool.filter((t) => t.charCount >= min && t.charCount <= max);
  }

  // Filtre difficulté
  if (options.difficulty !== undefined) {
    const diff = options.difficulty;
    pool = pool.filter((t) => t.difficulty === diff);
  } else if (options.difficultyMin !== undefined) {
    const min = options.difficultyMin;
    pool = pool.filter((t) => t.difficulty >= min);
  }

  // Exclure IDs récents (avec fallback si pool devient vide)
  if (options.excludeIds && options.excludeIds.length > 0) {
    const excluded = options.excludeIds;
    const filtered = pool.filter((t) => !excluded.includes(t.id));
    if (filtered.length > 0) pool = filtered;
  }

  return pool;
}
