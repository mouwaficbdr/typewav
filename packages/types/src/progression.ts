/**
 * Types de progression narrative : rangs et records personnels.
 * Spec : docs/specs/05-progression.md
 */

// ─── Rangs ─────────────────────────────────────────────────────────────────────

export type RankTier =
  | 'novice'
  | 'apprentice'
  | 'operator'
  | 'architect'
  | 'ghost';

export interface Rank {
  tier: RankTier;
  label: string;
  /** WPM médian minimum sur les 10 dernières sessions */
  minWpm: number;
  accentColor: string;
}

// Les rangs sont nommés d'après les indications de tempo (mêmes termes en
// fr et en, on ne les traduit pas). La vitesse de frappe = le tempo : plus
// le WPM monte, plus on joue vite. Les clés (`novice`...`ghost`) restent des
// identifiants internes stables (stockés dans le profil), seul le label change.
export const RANKS: Record<RankTier, Rank> = {
  novice: {
    tier: 'novice',
    label: 'Largo',
    minWpm: 0,
    accentColor: '#888888',
  },
  apprentice: {
    tier: 'apprentice',
    label: 'Andante',
    minWpm: 31,
    accentColor: '#4A9EFF',
  },
  operator: {
    tier: 'operator',
    label: 'Moderato',
    minWpm: 51,
    accentColor: '#00A896',
  },
  architect: {
    tier: 'architect',
    label: 'Allegro',
    minWpm: 71,
    accentColor: '#00D4AA',
  },
  ghost: {
    tier: 'ghost',
    label: 'Prestissimo',
    minWpm: 91,
    accentColor: '#FFD700',
  },
};

// ─── Profil utilisateur ────────────────────────────────────────────────────────

export interface PersonalRecords {
  maxWpm: { value: number; sessionId: string; achievedAt: number };
  maxAccuracy: { value: number; sessionId: string; achievedAt: number };
  maxConsistency: { value: number; sessionId: string; achievedAt: number };
  longestSession: { duration: number; sessionId: string; achievedAt: number };
  byCollection: Record<string, { wpm: number; achievedAt: number }>;
}

export interface UserProfile {
  unlockedThemes: string[];
  unlockedCollections: string[];
  currentRank: RankTier;
  pseudo: string;
}

// ─── Niveaux apprentissage ─────────────────────────────────────────────────────

/**
 * @deprecated Chemin QWERTY uniquement. Le parcours AZERTY est piloté par
 * `LEARNING_CURRICULUM_AZERTY` (./learning.ts). À supprimer quand le ticket
 * « Curriculum apprentissage QWERTY » aura porté le nouveau système à QWERTY.
 */
export interface LearningLevel {
  id: number;
  name: string;
  keys: string[];
  minAccuracy: number;
  minSamples: number;
}

/**
 * @deprecated Chemin QWERTY uniquement. Le parcours AZERTY est piloté par
 * `LEARNING_CURRICULUM_AZERTY` (./learning.ts). À supprimer quand le ticket
 * « Curriculum apprentissage QWERTY » aura porté le nouveau système à QWERTY.
 */
export const LEARNING_LEVELS: LearningLevel[] = [
  {
    id: 1,
    name: 'Home Row',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    minAccuracy: 90,
    minSamples: 50,
  },
  {
    id: 2,
    name: 'Top Row',
    keys: [
      'a',
      's',
      'd',
      'f',
      'j',
      'k',
      'l',
      ';',
      'q',
      'w',
      'e',
      'r',
      't',
      'y',
      'u',
      'i',
      'o',
      'p',
    ],
    minAccuracy: 85,
    minSamples: 80,
  },
  {
    id: 3,
    name: 'Bottom Row',
    keys: [
      'a',
      's',
      'd',
      'f',
      'j',
      'k',
      'l',
      ';',
      'q',
      'w',
      'e',
      'r',
      't',
      'y',
      'u',
      'i',
      'o',
      'p',
      'z',
      'x',
      'c',
      'v',
      'b',
      'n',
      'm',
    ],
    minAccuracy: 85,
    minSamples: 80,
  },
  {
    id: 4,
    name: 'Real Words',
    keys: 'abcdefghijklmnopqrstuvwxyz '.split(''),
    minAccuracy: 80,
    minSamples: 100,
  },
  {
    id: 5,
    name: 'Shift & Punctuation',
    keys: [], // all keys
    minAccuracy: 80,
    minSamples: 100,
  },
];
