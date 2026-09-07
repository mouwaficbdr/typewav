/**
 * Logique pure de progression du mode Apprentissage : niveaux, déblocage,
 * pondération de précision. Pas d'accès IndexedDB ici (voir
 * loadLearningProgress/saveLearningProgress plus bas pour la persistance).
 */

import type { CurriculumLevel, LearningLevel } from '@typewav/types';
import { getPreference, setPreference } from './db';

const LEARNING_PROGRESS_KEY = 'learning_level_progress';

export interface LevelProgress {
  levelId: number;
  accuracy: number;
  samples: number;
  unlocked: boolean;
}

export function createInitialLevelProgress(
  levels: LearningLevel[],
): LevelProgress[] {
  return levels.map((l) => ({
    levelId: l.id,
    accuracy: 0,
    samples: 0,
    unlocked: l.id === 1,
  }));
}

/**
 * Pourcentage de progression vers le déblocage du niveau suivant.
 * Reflète le facteur limitant (frappes OU précision), pas seulement la
 * précision : canUnlockNextLevel exige les deux critères, donc afficher
 * 100% de précision seule quand les frappes ne sont qu'à 10% de l'objectif
 * donnerait une fausse impression d'être presque prêt.
 */
export function calculateProgressPercent(
  progress: LevelProgress,
  level: LearningLevel,
): number {
  if (progress.samples === 0) return 0;
  const samplesRatio = progress.samples / level.minSamples;
  const accuracyRatio = progress.accuracy / level.minAccuracy;
  return Math.round(Math.min(samplesRatio, accuracyRatio) * 100);
}

export function canUnlockNextLevel(
  progress: LevelProgress,
  level: LearningLevel,
): boolean {
  return (
    progress.samples >= level.minSamples &&
    progress.accuracy >= level.minAccuracy
  );
}

/** Intègre les stats d'une session terminée dans la progression du niveau concerné. */
export function applySessionStats(
  progressList: LevelProgress[],
  levelId: number,
  stats: { correct: number; total: number },
): LevelProgress[] {
  return progressList.map((progress) => {
    if (progress.levelId !== levelId) return progress;

    const previousCorrect = (progress.accuracy / 100) * progress.samples;
    const nextSamples = progress.samples + stats.total;
    const nextCorrect = previousCorrect + stats.correct;
    const nextAccuracy =
      nextSamples === 0 ? 0 : (nextCorrect / nextSamples) * 100;

    return { ...progress, samples: nextSamples, accuracy: nextAccuracy };
  });
}

export function unlockLevel(
  progressList: LevelProgress[],
  levelId: number,
): LevelProgress[] {
  return progressList.map((p) =>
    p.levelId === levelId ? { ...p, unlocked: true } : p,
  );
}

export type KeyMastery = Record<string, { correct: number; total: number }>;

export function applyLearningKeystrokes(
  mastery: KeyMastery,
  entries: { gestureId: string; correct: boolean }[],
): KeyMastery {
  const next: KeyMastery = {};
  for (const [id, v] of Object.entries(mastery)) next[id] = { ...v };
  for (const e of entries) {
    const cur = next[e.gestureId] ?? { correct: 0, total: 0 };
    next[e.gestureId] = {
      correct: cur.correct + (e.correct ? 1 : 0),
      total: cur.total + 1,
    };
  }
  return next;
}

/**
 * Charge la progression sauvegardée : undefined si jamais sauvegardée
 * (première visite). Sans ça, un simple rechargement de page remet tous
 * les niveaux à zéro (seul le niveau 1 déverrouillé), perdant tout
 * l'entraînement déjà accompli.
 */
export async function loadLearningProgress(): Promise<
  LevelProgress[] | undefined
> {
  return getPreference<LevelProgress[]>(LEARNING_PROGRESS_KEY);
}

export async function saveLearningProgress(
  progress: LevelProgress[],
): Promise<void> {
  await setPreference(LEARNING_PROGRESS_KEY, progress);
}

function keyReachedBar(
  m: { correct: number; total: number } | undefined,
  level: CurriculumLevel,
): boolean {
  if (!m || m.total < level.minSamplesPerKey) return false;
  return (m.correct / m.total) * 100 >= level.minAccuracyPerKey;
}

export function canUnlockCurriculumLevel(
  level: CurriculumLevel,
  mastery: KeyMastery,
  levelProgress: { samples: number; accuracy: number },
): boolean {
  const everyKeyOk = level.newKeys.every((k) => keyReachedBar(mastery[k.id], level));
  if (!everyKeyOk) return false;
  if (level.kind === 'text') {
    if (levelProgress.samples < (level.minSamplesTotal ?? 0)) return false;
    if (levelProgress.accuracy < (level.minOverallAccuracy ?? 0)) return false;
  }
  return true;
}

export function calculateCurriculumProgress(
  level: CurriculumLevel,
  mastery: KeyMastery,
): { percent: number; weakestKeyId: string | null; weakestKeyAccuracy: number | null } {
  if (level.newKeys.length === 0) {
    return { percent: 100, weakestKeyId: null, weakestKeyAccuracy: null };
  }
  let reached = 0;
  let weakestKeyId: string | null = null;
  let weakestScore = Infinity;
  let weakestKeyAccuracy: number | null = null;
  for (const k of level.newKeys) {
    const m = mastery[k.id];
    if (keyReachedBar(m, level)) {
      reached += 1;
      continue;
    }
    const samplesRatio = (m?.total ?? 0) / level.minSamplesPerKey;
    const acc = m && m.total > 0 ? (m.correct / m.total) * 100 : 0;
    const accuracyRatio = acc / level.minAccuracyPerKey;
    const score = Math.min(samplesRatio, accuracyRatio);
    if (score < weakestScore) {
      weakestScore = score;
      weakestKeyId = k.id;
      weakestKeyAccuracy = Math.round(acc);
    }
  }
  return {
    percent: Math.round((100 * reached) / level.newKeys.length),
    weakestKeyId,
    weakestKeyAccuracy,
  };
}
