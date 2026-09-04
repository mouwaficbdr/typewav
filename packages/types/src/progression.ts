/**
 * Types de progression narrative — rangs, jalons, récompenses.
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

// ─── Jalons ────────────────────────────────────────────────────────────────────

export type Reward =
  | { type: 'theme'; themeId: string }
  | { type: 'collection'; collectionId: string }
  | { type: 'accent'; color: string };

export type MilestoneCondition =
  | { type: 'wpm'; value: number }
  | { type: 'accuracy'; value: number }
  | { type: 'sessions'; value: number }
  | { type: 'rank'; tier: RankTier }
  | { type: 'streak'; days: number };

export interface Milestone {
  id: string;
  condition: MilestoneCondition;
  reward: Reward;
  labelFr: string;
  labelEn: string;
}

/** Jalons disponibles dans l'application */
export const MILESTONES: Milestone[] = [
  {
    id: 'first_session',
    condition: { type: 'sessions', value: 1 },
    reward: { type: 'theme', themeId: 'noir' },
    labelFr: 'Première session',
    labelEn: 'First session',
  },
  {
    id: 'sessions_10',
    condition: { type: 'sessions', value: 10 },
    reward: { type: 'accent', color: '#FF6B35' },
    labelFr: '10 sessions complétées',
    labelEn: '10 sessions completed',
  },
  {
    id: 'sessions_50',
    condition: { type: 'sessions', value: 50 },
    reward: { type: 'theme', themeId: 'midnight-sun' },
    labelFr: '50 sessions complétées',
    labelEn: '50 sessions completed',
  },
  {
    id: 'wpm_50',
    condition: { type: 'wpm', value: 50 },
    reward: { type: 'accent', color: '#4A9EFF' },
    labelFr: '50 WPM atteints',
    labelEn: '50 WPM reached',
  },
  {
    id: 'wpm_70',
    condition: { type: 'wpm', value: 70 },
    reward: { type: 'theme', themeId: 'arcade' },
    labelFr: '70 WPM atteints',
    labelEn: '70 WPM reached',
  },
  {
    id: 'wpm_90',
    condition: { type: 'wpm', value: 90 },
    reward: { type: 'accent', color: '#FF3D7F' },
    labelFr: '90 WPM atteints',
    labelEn: '90 WPM reached',
  },
  {
    id: 'accuracy_99',
    condition: { type: 'accuracy', value: 99 },
    reward: { type: 'accent', color: '#FFD700' },
    labelFr: '99% de précision',
    labelEn: '99% accuracy',
  },
  {
    id: 'rank_architect',
    condition: { type: 'rank', tier: 'architect' },
    reward: { type: 'accent', color: '#00D4AA' },
    labelFr: 'Rang Architecte atteint',
    labelEn: 'Architect rank reached',
  },
  {
    id: 'rank_ghost',
    condition: { type: 'rank', tier: 'ghost' },
    reward: { type: 'accent', color: '#FFD700' },
    labelFr: 'Rang Fantôme atteint',
    labelEn: 'Ghost rank reached',
  },
];

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
  unlockedMilestoneIds: string[];
  currentRank: RankTier;
  pseudo: string;
}

// ─── Niveaux apprentissage ─────────────────────────────────────────────────────

export interface LearningLevel {
  id: number;
  name: string;
  keys: string[];
  minAccuracy: number;
  minSamples: number;
}

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
