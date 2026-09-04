/**
 * recommendation.ts — sélection musicale contextuelle.
 *
 * Fonction pure, zéro état, zéro side-effect.
 * Testable unitairement sans mock.
 *
 * Spec : docs/specs/33-music-recommendation.md
 */

import type { TypingMode } from '@typewav/types';
import {
  MUSIC_LIBRARY,
  type EmotionalRegister,
  type MusicPiece,
} from './library';

export type CollectionId =
  | 'litterature'
  | 'poesie'
  | 'philosophie'
  | 'gaming'
  | 'code';

/**
 * Retourne le registre émotionnel recommandé selon le contexte de session.
 *
 * Priorité : mode > collection > durée.
 * Si aucune règle ne matche, retourne 'romantique' (registre universel neutre).
 */
export function getRecommendedRegister(
  mode: TypingMode,
  collection: CollectionId | undefined,
  durationSeconds: number,
): EmotionalRegister {
  // Règles sur le mode (priorité maximale). Seuls les modes réellement
  // exposés par la config bar sont listés ; 'classic', 'quote', 'zen' et
  // 'custom' n'ont pas de règle mode et passent à la collection.
  const modeRules: Partial<Record<TypingMode, EmotionalRegister>> = {
    sprint: 'energique',
    ghost: 'energique',
    challenge: 'energique',
    learning: 'contemplatif',
    code: 'dramatique',
  };

  const byMode = mode in modeRules ? modeRules[mode] : undefined;
  if (byMode) return byMode;

  // Règles sur la collection (priorité secondaire)
  if (collection) {
    const collectionRules: Partial<Record<CollectionId, EmotionalRegister>> = {
      poesie: 'romantique',
      philosophie: 'dramatique',
      gaming: 'energique',
      // litterature → pas de règle, laisse passer au filtre durée
      code: 'dramatique',
    };
    const byCollection = collectionRules[collection];
    if (byCollection) return byCollection;
  }

  // Règles sur la durée (priorité tertiaire)
  if (durationSeconds <= 15) return 'energique';
  if (durationSeconds >= 120) return 'contemplatif';

  // Fallback universel
  return 'romantique';
}

/**
 * Sélectionne une pièce aléatoire dans un registre donné.
 * Exclut les pièces à tempo évolutif si excludeEvolutive = true.
 *
 * @param excludeIds - IDs de pièces à exclure (éviter les doublons récents)
 */
export function pickPiece(
  register: EmotionalRegister,
  excludeIds: string[] = [],
  excludeEvolutive = false,
): MusicPiece | null {
  let pool = MUSIC_LIBRARY.filter((p) => p.register === register);

  if (excludeEvolutive) {
    pool = pool.filter((p) => !p.evolutiveTempo);
  }

  // Exclure les pièces récemment jouées
  const filtered = pool.filter((p) => !excludeIds.includes(p.id));

  // Si le pool filtré est vide, utiliser tout le pool (pas de deadlock)
  const candidates = filtered.length > 0 ? filtered : pool;

  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

/**
 * API haut niveau : retourne directement une pièce recommandée.
 */
export function getRecommendedPiece(
  mode: TypingMode,
  collection: CollectionId | undefined,
  durationSeconds: number,
  excludeIds: string[] = [],
): MusicPiece | null {
  const register = getRecommendedRegister(mode, collection, durationSeconds);
  return pickPiece(register, excludeIds);
}
