import { getPreference, setPreference } from './db';

/** Drapeau posé en fin d'Ouverture ou en la passant. L'ancien `has_completed_onboarding` reste en place, non lu. */
export const INTRO_FLAG_KEY = 'has_seen_intro_v1';

/**
 * true si l'Ouverture a déjà été vue, ou si la lecture échoue : on ne piège
 * jamais un visiteur derrière une Ouverture qui ne se fermerait jamais.
 */
export async function hasSeenIntro(): Promise<boolean> {
  try {
    return (await getPreference<boolean>(INTRO_FLAG_KEY)) === true;
  } catch {
    return true;
  }
}

/** N'échoue jamais : une écriture ratée ne doit pas bloquer la sortie de l'Ouverture. */
export async function markIntroSeen(): Promise<void> {
  try {
    await setPreference(INTRO_FLAG_KEY, true);
  } catch {
    // best-effort : la session suivante retentera la lecture
  }
}
