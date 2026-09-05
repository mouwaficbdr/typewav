/**
 * fetch.ts : sélection contextuelle de textes depuis une collection.
 *
 * API haut niveau : filtre par langue, longueur, durée et difficulté.
 * Anti-deadlock : si le pool filtré est vide après exclusions, élargit
 * progressivement jusqu'à retourner un texte (jamais null sur collection non vide).
 *
 * Spec : docs/specs/34-collections-refonte.md (Phase 2)
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
  /** Mode typing : informatif, non utilisé directement dans le filtrage */
  mode?: TypingMode;
  /**
   * Pour mode Mots : nombre de mots demandés. Filtre sur un MINIMUM (le
   * texte choisi aura toujours au moins ce nombre de mots), pour que la
   * troncature en aval (truncateToWords) puisse toujours couper exactement
   * ce nombre, jamais moins que ce que le chip promet.
   */
  wordCount?: 10 | 25 | 50 | 100;
  /** Pour mode Temps : durée en secondes */
  durationSeconds?: 15 | 30 | 60 | 120;
  /** Filtre de difficulté exacte */
  difficulty?: 1 | 2 | 3 | 4 | 5;
  /** Difficulté min (inclusive) */
  difficultyMin?: 1 | 2 | 3 | 4 | 5;
  /**
   * Quand vrai, privilégie un texte contenant au moins un chiffre, jamais
   * injecté, seulement préféré parmi ceux qui en ont déjà un naturellement.
   * Filtre souple : relâché comme wordCount/durationSeconds si le pool
   * devient vide (voir le relâchement progressif de selectFromTexts).
   */
  numbersEnabled?: boolean;
  /** IDs à exclure : éviter les doublons récents */
  excludeIds?: string[];
}

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
 * Retourne un texte aléatoire parmi un tableau de textes déjà en mémoire,
 * filtré selon les options.
 *
 * Ne retourne jamais null si le tableau n'est pas vide. Si les filtres
 * réduisent le pool à zéro, ils sont relâchés progressivement.
 *
 * Pure et sans dépendance aux collections statiques du package : c'est ce
 * qui permet à un client (déjà en possession d'un tableau de textes, par ex.
 * chargé via Server Action) de réutiliser exactement cette logique de
 * ciblage sans jamais importer les données des 5 collections.
 */
export function selectFromTexts(
  texts: TextEntry[],
  options: FetchOptions = {},
): TextEntry | null {
  if (texts.length === 0) return null;

  let pool = _applyFilters(texts, options);

  // Relâchement 1 : sans filtre de longueur (wordCount/durationSeconds),
  // mais en gardant numbersEnabled : un chiffre est un choix explicite de
  // l'utilisateur (le bouton "chiffres"), la cible de longueur n'est qu'une
  // préférence de confort. Les relâcher ensemble ferait perdre le chiffre
  // dès que le pool est trop court pour la durée/le nombre de mots demandé.
  if (pool.length === 0) {
    const opts: FetchOptions = {};
    if (options.language) opts.language = options.language;
    if (options.numbersEnabled) opts.numbersEnabled = options.numbersEnabled;
    if (options.difficulty !== undefined) opts.difficulty = options.difficulty;
    if (options.difficultyMin !== undefined) opts.difficultyMin = options.difficultyMin;
    if (options.excludeIds) opts.excludeIds = options.excludeIds;
    pool = _applyFilters(texts, opts);
  }

  // Relâchement 2 : si encore vide, abandonner aussi numbersEnabled
  if (pool.length === 0) {
    const opts: FetchOptions = {};
    if (options.language) opts.language = options.language;
    if (options.difficulty !== undefined) opts.difficulty = options.difficulty;
    if (options.difficultyMin !== undefined) opts.difficultyMin = options.difficultyMin;
    if (options.excludeIds) opts.excludeIds = options.excludeIds;
    pool = _applyFilters(texts, opts);
  }

  // Relâchement 3 : si encore vide, essayer seulement langue + exclusions
  if (pool.length === 0) {
    const opts: FetchOptions = {};
    if (options.language) opts.language = options.language;
    if (options.excludeIds) opts.excludeIds = options.excludeIds;
    pool = _applyFilters(texts, opts);
  }

  // Fallback total : tout le tableau
  if (pool.length === 0) {
    pool = texts;
  }

  return pool[Math.floor(Math.random() * pool.length)]!;
}

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
  return selectFromTexts(COLLECTION_MAP[collectionId].texts, options);
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

  // Filtre wordCount, minimum seulement (pas de plage symétrique) : le mode
  // Sprint tronque ensuite exactement à ce nombre de mots
  // (text-filters.ts::truncateToWords), qui ne fait que couper, jamais
  // compléter. Un texte plus court que la cible produirait donc moins de
  // mots que ce que le chip annonce.
  if (options.wordCount !== undefined) {
    const minWordCount = options.wordCount;
    pool = pool.filter((t) => t.wordCount >= minWordCount);
  }

  // Filtre durationSeconds
  if (options.durationSeconds !== undefined) {
    const targetChars = options.durationSeconds * CHARS_PER_SECOND;
    const min = targetChars * (1 - DURATION_TOLERANCE);
    const max = targetChars * (1 + DURATION_TOLERANCE);
    pool = pool.filter((t) => t.charCount >= min && t.charCount <= max);
  }

  // Préférence chiffres, jamais bloquant seul (relâché en amont si besoin)
  if (options.numbersEnabled) {
    pool = pool.filter((t) => /[0-9]/.test(t.content));
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
