/**
 * L'instrument du Conservatoire (D6) : une note par doigt, l'octave par
 * rangée. Remplace la gamme pentatonique par colonne livrée pour #117.
 */

import type { FingerId } from '@typewav/types';
import { keyByCode, type PhysicalRow } from './physical-keys';

const DEGREE: Partial<Record<FingerId, readonly [note: string, octaveShift: number]>> = {
  LP: ['C', 0],
  LR: ['D', 0],
  LM: ['E', 0],
  LI: ['F', 0],
  RI: ['G', 0],
  RM: ['A', 0],
  RR: ['B', 0],
  RP: ['C', 1],
};

const OCTAVE: Record<PhysicalRow, number | null> = {
  home: 4,
  top: 5,
  bottom: 3,
  digits: 6,
  mods: null,
};

/** La note d'une touche physique ; `null` pour Espace, Maj ou un code inconnu. */
export function pitchForCode(code: string): string | null {
  const key = keyByCode(code);
  if (!key) return null;
  const octave = OCTAVE[key.row];
  const degree = DEGREE[key.finger];
  if (octave === null || !degree) return null;
  return `${degree[0]}${octave + degree[1]}`;
}

/** Cadence de validation, reprise de `LevelClearedMoment` : [note, délai ms, durée s]. */
export const CADENCE = [
  ['E4', 0, 0.45],
  ['G4', 160, 0.45],
  ['C5', 340, 1.1],
] as const;

/** Le son doux et bref d'un choix. */
export const CHOICE_NOTE = 'E5';
