/**
 * Le profil du Conservatoire et les règles du test de placement (spec partie
 * 2, « Le test de placement »). La lecture arrive avec son consommateur, en
 * partie 4.
 */

import type {
  ConservatoireProfile,
  ExperienceLevel,
  PlacementOutcome,
  PlacementResult,
} from '@typewav/types';
import { setPreference } from '../db';

const PROFILE_KEY = 'conservatoire_profile';
export const PLACEMENT_MIN_WPM = 30;
export const PLACEMENT_MIN_ACCURACY = 95;

export function placementOutcome(
  experience: ExperienceLevel,
  placement: PlacementResult | null,
): PlacementOutcome {
  if (experience === 'beginner') return 'lesson1';
  if (
    experience === 'touch-typist' &&
    placement !== null &&
    placement.wpm >= PLACEMENT_MIN_WPM &&
    placement.accuracy >= PLACEMENT_MIN_ACCURACY
  ) {
    return 'cycle1-validated';
  }
  return 'lesson1-fast';
}

export async function saveProfile(profile: ConservatoireProfile): Promise<boolean> {
  try {
    await setPreference(PROFILE_KEY, profile);
    return true;
  } catch {
    return false;
  }
}
