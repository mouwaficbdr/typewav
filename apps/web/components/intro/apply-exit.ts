export type IntroLanguage = 'fr' | 'en';

export interface IntroExit {
  /** Langue choisie explicitement à l'écran 1 (F/E), null si aucun geste de langue. */
  chosenLanguage: IntroLanguage | null;
  /** Langue dans laquelle l'Ouverture s'est jouée (présélection, avant tout choix). */
  introLanguage: IntroLanguage;
  firstRun: boolean;
}

/**
 * Règles appliquées à la sortie de l'Ouverture (fin ou Échap, voir spec
 * partie B « Entrée, sortie, mémoire ») :
 * - à la première visite, la langue de l'Ouverture s'applique même si on
 *   passe dès l'écran 1 sans choisir explicitement ;
 * - rejouée depuis À propos, seule une langue choisie explicitement s'applique,
 *   et aucun autre réglage (mode, durée) ne bouge.
 */
export function exitSettings(exit: IntroExit): {
  textLanguage: IntroLanguage | null;
  setTimedMode30: boolean;
  localeTarget: IntroLanguage | null;
} {
  const language =
    exit.chosenLanguage ?? (exit.firstRun ? exit.introLanguage : null);
  return {
    textLanguage: language,
    setTimedMode30: exit.firstRun,
    localeTarget: language,
  };
}
