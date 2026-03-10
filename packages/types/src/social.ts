import type { TypingMode } from './session';

/**
 * Types pour le layer social Phase 3.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md
 */

// ---------------------------------------------------------------------------
// Replay partageable
// ---------------------------------------------------------------------------

export interface ReplayData {
  sessionId: string;
  text: string;
  /** Timings inter-frappe (ms entre chaque frappe) */
  keystrokeTimings: number[];
  wpm: number;
  accuracy: number;
  theme: string;
  soundPack: string;
  achievedAt: number;
}

// ---------------------------------------------------------------------------
// Challenge direct — tout dans l'URL, sans serveur
// ---------------------------------------------------------------------------

export interface ChallengeParams {
  /** Hash SHA-1 tronqué du texte — garantit le même texte */
  textHash: string;
  /** Texte compressé en base64url (max 2048 chars URL totale) */
  textB64: string;
  duration: number;
  mode: TypingMode;
  /** WPM du créateur — affiché "Battre X WPM" */
  creatorWpm?: number;
}

// ---------------------------------------------------------------------------
// Leaderboard contextuel (Supabase public, sans auth)
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  pseudo: string;
  wpm: number;
  accuracy: number;
  achievedAt: number;
  collectionId: string;
  mode: TypingMode;
  /** Format 'YYYY-WW' (semaine ISO) */
  week: string;
}

// ---------------------------------------------------------------------------
// Stats hebdomadaires + plateau
// ---------------------------------------------------------------------------

export interface WeeklySummary {
  weekStart: number;
  sessionsCount: number;
  avgWpm: number;
  /** Delta WPM par rapport à la semaine précédente */
  wpmDelta: number;
  bestDay: string;
  mostImprovedBigram: string;
}

export interface PlateauInfo {
  /** Position de la session où le plateau commence (index) */
  startIndex: number;
  /** WPM médian pendant le plateau */
  medianWpm: number;
  /** Recommandation générée */
  recommendation: PlateauRecommendation;
}

export type PlateauRecommendation =
  | 'practice_punctuation'
  | 'practice_numbers'
  | 'practice_bigrams'
  | 'increase_duration'
  | 'try_new_collection';
