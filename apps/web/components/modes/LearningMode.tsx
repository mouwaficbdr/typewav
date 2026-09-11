'use client';

import { useKeyboardLayoutPreference } from '@/hooks/useKeyboardLayoutPreference';
import { CurriculumLearningMode } from './CurriculumLearningMode';
import { LegacyLearningMode, type LearningModeProps } from './LegacyLearningMode';

export type { LearningModeProps };

/**
 * Dispatcher du mode Apprentissage selon la disposition clavier choisie :
 * `azerty` → le nouveau parcours piloté par curriculum (`CurriculumLearningMode`),
 * `qwerty` → l'ancien parcours (`LegacyLearningMode`), en attendant que le
 * curriculum soit porté à QWERTY (ticket dédié).
 */
export function LearningMode(props: LearningModeProps) {
  const { layout } = useKeyboardLayoutPreference();
  return layout === 'azerty' ? (
    <CurriculumLearningMode {...props} />
  ) : (
    <LegacyLearningMode {...props} />
  );
}
