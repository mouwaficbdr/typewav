'use client';

import { LegacyLearningMode, type LearningModeProps } from './LegacyLearningMode';

export type { LearningModeProps };

export function LearningMode(props: LearningModeProps) {
  // Task 12 : bifurquer sur la disposition clavier (azerty -> CurriculumLearningMode).
  // Pour l'instant, toujours l'ancien comportement.
  return <LegacyLearningMode {...props} />;
}
