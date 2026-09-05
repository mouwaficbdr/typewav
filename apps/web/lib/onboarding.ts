/**
 * Détection "première visite" — un seul flag persisté (IndexedDB, via le
 * store générique user_preferences), posé quand l'utilisateur quitte le
 * tutoriel de démarrage (skip ou réussite réelle).
 */

import { getPreference, setPreference } from './db';

const ONBOARDING_KEY = 'has_completed_onboarding';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await getPreference<boolean>(ONBOARDING_KEY);
  return value === true;
}

export async function markOnboardingComplete(): Promise<void> {
  await setPreference(ONBOARDING_KEY, true);
}

// Écran de positionnement des doigts du mode Apprentissage (ticket #62) :
// même flag "vu une fois" que l'onboarding général, mais remis à zéro
// explicitement depuis Paramètres pour permettre de le revoir après un
// changement de disposition clavier.
const LEARNING_FINGER_INTRO_KEY = 'has_seen_learning_finger_intro';

export async function hasSeenLearningFingerIntro(): Promise<boolean> {
  const value = await getPreference<boolean>(LEARNING_FINGER_INTRO_KEY);
  return value === true;
}

export async function markLearningFingerIntroSeen(): Promise<void> {
  await setPreference(LEARNING_FINGER_INTRO_KEY, true);
}

export async function resetLearningFingerIntroSeen(): Promise<void> {
  await setPreference(LEARNING_FINGER_INTRO_KEY, false);
}
