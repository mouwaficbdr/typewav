/**
 * Moteur de maîtrise du Conservatoire : fonctions pures sur un objet
 * `Mastery` immuable. Spec : 2026-10-08-conservatoire-v1-design.md, partie 1.
 */

import type { Attempt, GestureRecord, KeyState, Mastery } from '@typewav/types';
import { mapCharToGestureId } from '../learning-content';

export const WINDOW = 30;
export const MIN_ATTEMPTS = 20;
export const SURE_ACCURACY = 0.95;
export const AUTOMATIC_MEDIAN_MS = 450;
export const PAUSE_MS = 3000;
export const REVIEW_DAYS = [1, 3, 7, 14, 30] as const;

export function accuracy(attempts: readonly Attempt[]): number {
  if (attempts.length === 0) return 0;
  return attempts.filter((a) => a.correct).length / attempts.length;
}

export function medianLatency(attempts: readonly Attempt[]): number | null {
  const values = attempts
    .filter((a) => a.correct && a.latencyMs !== null)
    .map((a) => a.latencyMs as number)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 1
    ? values[mid]!
    : (values[mid - 1]! + values[mid]!) / 2;
}

export function isSureOrBetter(state: KeyState): boolean {
  return state === 'sure' || state === 'automatic';
}

export function keyState(record: GestureRecord | undefined): KeyState {
  if (!record || !record.attempts.some((a) => a.correct)) return 'new';
  const { attempts } = record;
  if (attempts.length < MIN_ATTEMPTS || accuracy(attempts) < SURE_ACCURACY) {
    return 'learned';
  }
  const median = medianLatency(attempts);
  return median !== null && median <= AUTOMATIC_MEDIAN_MS ? 'automatic' : 'sure';
}

function sameLocalDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/**
 * Ajoute une tentative au geste du caractère attendu (juste ou fausse : une
 * erreur corrigée compte, D11). `previousAt` = instant de la frappe précédente
 * de l'exercice, `null` en début d'exercice.
 */
export function recordAttempt(
  mastery: Mastery,
  input: { expected: string; correct: boolean; at: number },
  previousAt: number | null,
): Mastery {
  const id = mapCharToGestureId(input.expected);
  if (id === '') return mastery;

  const gap = previousAt === null ? null : input.at - previousAt;
  const latencyMs = gap !== null && gap >= 0 && gap <= PAUSE_MS ? gap : null;

  const prev = mastery[id];
  const attempts = [
    ...(prev?.attempts ?? []),
    { correct: input.correct, latencyMs, at: input.at },
  ].slice(-WINDOW);
  const draft: GestureRecord = {
    attempts,
    lastSeenAt: input.at,
    reviewStep: prev?.reviewStep ?? 0,
  };

  let reviewStep = draft.reviewStep;
  if (keyState(draft) === 'learned') {
    reviewStep = 0;
  } else if (
    prev &&
    isSureOrBetter(keyState(prev)) &&
    !sameLocalDay(prev.lastSeenAt, input.at)
  ) {
    reviewStep = Math.min(reviewStep + 1, REVIEW_DAYS.length - 1);
  }

  return { ...mastery, [id]: { ...draft, reviewStep } };
}
