export type TypingMode =
  | 'classic' // Mots aléatoires
  | 'learning' // Apprentissage Home Row : débutants
  | 'bigrams' // Bigrams ciblés depuis diagnostic
  | 'code' // Snippets de code réel
  | 'numbers' // Chiffres et ponctuation
  | 'sprint' // 10 mots, le plus vite possible
  | 'endurance' // Session longue : analyse dégradation
  | 'custom' // Texte personnel
  | 'classics' // Mode MIDI : pièces classiques
  | 'ghost' // Avec curseur fantôme (record personnel)
  | 'challenge' // Challenge partagé via URL
  | 'quote' // Citation unique
  | 'zen'; // Mode sans pression, sans timer

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
  | 'moderate' // Chute 15-30 %
  | 'severe'; // Chute > 30 %

export interface SessionResult {
  id: string;
  timestamp: number;
  /** WPM brut (total caractères / 5 / minutes) */
  wpm: number;
  /** WPM net : pénalité erreurs (non corrigées) */
  wpmNet: number;
  /** Pourcentage de frappes correctes sur le total */
  accuracy: number;
  /** Stabilité de la vitesse : 100 - (σWPM / μWPM × 100) */
  consistency: number;
  /** Durée totale du test en ms */
  duration: number;
  mode: TypingMode;
  themeId: string;
  collectionId?: string;
  soundPackId: string;
  keystrokeData: KeystrokeEntry[];
  /** Texte original de la session : utilisé pour la génération de replays partageables */
  text?: string;
  /** Événements note enregistrés pendant la session : optional pour backward compat */
  noteEvents?: NoteEvent[];
}

/** Événement note généré par une frappe correcte */
export interface NoteEvent {
  /** Nom de la note jouée, ex: "C4", "G5" */
  noteName: string;
  /** Timestamp depuis le début de la session (ms) */
  timestamp: number;
  /** Index de position dans le texte */
  charIndex: number;
  /** Les erreurs ne génèrent pas d'événement note */
  isError: false;
}
