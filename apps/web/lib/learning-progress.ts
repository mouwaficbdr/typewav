/**
 * Logique pure de progression du mode Apprentissage : niveaux, déblocage,
 * pondération de précision. Pas d'accès IndexedDB ici (voir
 * loadLearningProgress/saveLearningProgress plus bas pour la persistance).
 */

import type { LearningLevel } from '@typewav/types';
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
