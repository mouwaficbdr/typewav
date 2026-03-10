/**
 * Moteur de difficulté adaptative.
 * Spec : docs/specs/07-adaptive-difficulty.md
 *
 * Principe : l'adaptation ne s'annonce jamais — totalement invisible.
 * Si l'utilisateur remarque l'adaptation, réduire les deltas.
 */

export interface AdaptiveSignals {
  /** WPM sur les 5 dernières secondes */
  recentWpm: number;
  /** Accuracy sur les 5 dernières secondes */
  recentAccuracy: number;
  /** Stabilité de la vitesse sur la même fenêtre (0-100) */
  consistency: number;
  /** WPM médian de la session en cours */
  baseline: number;
  /** Durée depuis le dernier changement de difficulté en ms */
  msSinceLastChange: number;
}

export interface AdaptiveAction {
  /** -1 = simplifier, 0 = maintenir, +1 = complexifier */
  wordComplexity: -1 | 0 | 1;
  /** Multiplicateur tempo pour l'audio (0.9–1.1) */
  tempoMultiplier: number;
  /** Introduire un nouveau type de caractère (ponctuation, chiffres…) */
  introduceNewCharType: boolean;
}

export type DifficultyMode = 'adaptive' | 'fixed' | 'custom';

export type FixedDifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert';

export interface FixedDifficulty {
  mode: 'fixed';
  level: FixedDifficultyLevel;
}

export interface CustomDifficulty {
  mode: 'custom';
  wordLengthMin: number;
  wordLengthMax: number;
  punctuationFrequency: number;
  numbersFrequency: number;
  progressionRate: number;
}

const STAGNATION_THRESHOLD_MS = 30_000;

function isStagnating(signals: AdaptiveSignals): boolean {
  return signals.msSinceLastChange > STAGNATION_THRESHOLD_MS;
}

/**
 * Évalue les signaux courants et retourne l'action d'adaptation.
 * Appelée toutes les 5 secondes depuis useSession.
 */
export function evaluateAdaptation(signals: AdaptiveSignals): AdaptiveAction {
  const { recentWpm, recentAccuracy, consistency, baseline } = signals;

  // Flow parfait — augmenter la complexité
  if (recentAccuracy > 95 && recentWpm > baseline * 1.1 && consistency > 85) {
    return {
      wordComplexity: 1,
      tempoMultiplier: 1.05,
      introduceNewCharType: false,
    };
  }

  // Chute de performance — simplifier
  if (recentAccuracy < 80 || recentWpm < baseline * 0.8) {
    return {
      wordComplexity: -1,
      tempoMultiplier: 0.95,
      introduceNewCharType: false,
    };
  }

  // Stagnation — introduire de la nouveauté
  if (isStagnating(signals)) {
    return {
      wordComplexity: 0,
      tempoMultiplier: 1.0,
      introduceNewCharType: true,
    };
  }

  // Performance normale — pas de changement
  return {
    wordComplexity: 0,
    tempoMultiplier: 1.0,
    introduceNewCharType: false,
  };
}

/**
 * Filtre une liste de mots selon le niveau de complexité courant.
 * complexity : 1 (simple) → 5 (complexe)
 */
export function filterWordsByComplexity(
  words: string[],
  complexity: number,
): string[] {
  const clampedLevel = Math.max(1, Math.min(5, complexity));

  const maxLength = [4, 6, 8, 10, Infinity][clampedLevel - 1] as number;
  const minLength = [1, 3, 5, 7, 9][clampedLevel - 1] as number;

  const filtered = words.filter(
    (w) => w.length >= minLength && w.length <= maxLength,
  );

  // Fallback : si le filtre retourne 0 mots, utiliser toute la liste
  return filtered.length > 0 ? filtered : words;
}
