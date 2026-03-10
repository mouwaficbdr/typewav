export type TypingMode =
  | 'classic' // Mots aléatoires
  | 'learning' // Apprentissage Home Row — débutants
  | 'bigrams' // Bigrams ciblés depuis diagnostic
  | 'code' // Snippets de code réel
  | 'numbers' // Chiffres et ponctuation
  | 'sprint' // 10 mots, le plus vite possible
  | 'endurance' // Session longue — analyse dégradation
  | 'custom' // Texte personnel
  | 'classics' // Mode MIDI — pièces classiques
  | 'ghost' // Avec curseur fantôme (record personnel)
  | 'challenge'; // Challenge partagé via URL

export interface KeystrokeEntry {
  char: string;
  timestamp: number;
  correct: boolean;
  /** Durée depuis la frappe précédente, en ms (alias spec 02 : timeFromPrevious) */
  deltaMs: number;
}

/** Statistiques d'un enchaînement de deux touches */
export interface BigramStats {
  bigram: string;
  avgMs: number;
  occurrences: number;
}

/** Pattern de dégradation de la performance en cours de session */
export type FatiguePattern =
  | 'none'
  | 'mild' // Chute < 15 % de WPM entre 1ère et 2ème moitié
  | 'moderate' // Chute 15–30 %
  | 'severe'; // Chute > 30 %

export interface SessionResult {
  id: string;
  timestamp: number;
  /** WPM brut (total caractères / 5 / minutes) */
  wpm: number;
  /** WPM net — pénalité erreurs (non corrigées) */
  wpmNet: number;
  /** Pourcentage de frappes correctes sur le total */
  accuracy: number;
  /** Stabilité de la vitesse — 100 - (σWPM / μWPM × 100) */
  consistency: number;
  /** Durée totale du test en ms */
  duration: number;
  mode: TypingMode;
  themeId: string;
  collectionId?: string;
  soundPackId: string;
  keystrokeData: KeystrokeEntry[];
}
