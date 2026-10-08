/**
 * Persistance de la maîtrise du Conservatoire : une seule clé du store
 * `user_preferences`, en échec ouvert (jamais d'exception vers l'appelant).
 */

import type { Attempt, GestureRecord, Mastery } from '@typewav/types';
import { getPreference, setPreference } from '../db';
import { WINDOW } from './mastery';

const MASTERY_KEY = 'conservatoire_mastery';

function isAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.correct === 'boolean' &&
    typeof a.at === 'number' &&
    (a.latencyMs === null || typeof a.latencyMs === 'number')
  );
}

/** Ne garde que les enregistrements bien formés, tronqués à `WINDOW` tentatives. */
function sanitize(raw: unknown): Mastery {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Mastery = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const record = value as Partial<Record<keyof GestureRecord, unknown>>;
    if (
      !Array.isArray(record.attempts) ||
      typeof record.lastSeenAt !== 'number' ||
      typeof record.reviewStep !== 'number'
    ) {
      continue;
    }
    out[id] = {
      attempts: record.attempts.filter(isAttempt).slice(-WINDOW),
      lastSeenAt: record.lastSeenAt,
      reviewStep: record.reviewStep,
    };
  }
  return out;
}

export async function loadMastery(): Promise<{ mastery: Mastery; persisted: boolean }> {
  try {
    const raw = await getPreference<unknown>(MASTERY_KEY);
    return { mastery: sanitize(raw), persisted: true };
  } catch {
    return { mastery: {}, persisted: false };
  }
}

export async function saveMastery(mastery: Mastery): Promise<boolean> {
  try {
    await setPreference(MASTERY_KEY, mastery);
    return true;
  } catch {
    return false;
  }
}
