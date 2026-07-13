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
