/**
 * Logique de progression narrative — rangs, jalons, records.
 * Spec : docs/specs/05-progression.md
 *
 * Logique pure — pas d'imports React, pas de hooks.
 * Testable indépendamment.
 */

import {
  MILESTONES,
  RANKS,
  type Milestone,
  type PersonalRecords,
  type RankTier,
  type SessionResult,
  type TypingMode,
  type UserProfile,
} from '@typewav/types';

/**
 * Modes détente/apprentissage — jamais pris en compte pour le rang ou les
 * records personnels, sans quoi un score obtenu sans pression fausserait un
 * classement de performance.
 */
const NON_COMPETITIVE_MODES: ReadonlySet<TypingMode> = new Set([
  'zen',
  'learning',
  'endurance',
]);

// ─── Rang ──────────────────────────────────────────────────────────────────────

/**
 * Calcule le rang d'un utilisateur à partir de la médiane WPM net
 * des 10 dernières sessions compétitives.
 */
export function calculateRank(sessions: SessionResult[]): RankTier {
  const competitive = sessions.filter(
    (s) => !NON_COMPETITIVE_MODES.has(s.mode),
  );
  const last10 = competitive.slice(0, 10);
  if (last10.length === 0) return 'novice';

  return rankTierForWpm(calculateMedianWpm(last10));
}

/**
 * Palier de tempo correspondant à un WPM donné, une seule performance plutôt
 * qu'une médiane glissante. Sert à étiqueter une session individuelle (par
 * ex. dans le classement local, où chaque ligne est sa propre performance).
 */
export function rankTierForWpm(wpm: number): RankTier {
  const tiers: RankTier[] = [
    'ghost',
    'architect',
    'operator',
    'apprentice',
    'novice',
  ];
  for (const tier of tiers) {
    if (wpm >= RANKS[tier].minWpm) return tier;
  }

  return 'novice';
}

function calculateMedianWpm(sessions: SessionResult[]): number {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions].sort((a, b) => a.wpmNet - b.wpmNet);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]!.wpmNet + sorted[mid]!.wpmNet) / 2
    : sorted[mid]!.wpmNet;
}

// ─── Jalons ────────────────────────────────────────────────────────────────────

/**
 * Vérifie les jalons nouvellement débloqués après une session.
 * Retourne uniquement les jalons qui viennent d'être débloqués.
 */
export function checkMilestones(
  sessions: SessionResult[],
  profile: UserProfile,
): Milestone[] {
  const newlyUnlocked: Milestone[] = [];
  const latestSession = sessions[0];
  if (!latestSession) return newlyUnlocked;

  const currentRank = calculateRank(sessions);

  for (const milestone of MILESTONES) {
    if (profile.unlockedMilestoneIds.includes(milestone.id)) continue;

    const { condition } = milestone;

    let conditionMet = false;
    switch (condition.type) {
      case 'sessions':
        conditionMet = sessions.length >= condition.value;
        break;
      case 'wpm':
        conditionMet = latestSession.wpmNet >= condition.value;
        break;
      case 'accuracy':
        conditionMet = latestSession.accuracy >= condition.value;
        break;
      case 'rank':
        conditionMet = isRankAtLeast(currentRank, condition.tier);
        break;
      case 'streak':
        conditionMet = calculateStreak(sessions) >= condition.days;
        break;
    }

    if (conditionMet) {
      newlyUnlocked.push(milestone);
    }
  }

  return newlyUnlocked;
}

function isRankAtLeast(current: RankTier, minimum: RankTier): boolean {
  const order: RankTier[] = [
    'novice',
    'apprentice',
    'operator',
    'architect',
    'ghost',
  ];
  return order.indexOf(current) >= order.indexOf(minimum);
}

function calculateStreak(sessions: SessionResult[]): number {
  if (sessions.length === 0) return 0;

  const DAY_MS = 86_400_000;
  let streak = 1;
  let lastDay = Math.floor(sessions[0]!.timestamp / DAY_MS);

  for (let i = 1; i < sessions.length; i++) {
    const sessionDay = Math.floor(sessions[i]!.timestamp / DAY_MS);
    if (lastDay - sessionDay === 1) {
      streak++;
      lastDay = sessionDay;
    } else if (lastDay - sessionDay === 0) {
      // Même jour — skip
      continue;
    } else {
      break;
    }
  }

  return streak;
}

// ─── Records personnels ────────────────────────────────────────────────────────

const DEFAULT_RECORDS: PersonalRecords = {
  maxWpm: { value: 0, sessionId: '', achievedAt: 0 },
  maxAccuracy: { value: 0, sessionId: '', achievedAt: 0 },
  maxConsistency: { value: 0, sessionId: '', achievedAt: 0 },
  longestSession: { duration: 0, sessionId: '', achievedAt: 0 },
  byCollection: {},
};

/**
 * Met à jour les records personnels avec une nouvelle session.
 * Retourne les records mis à jour (immuable — ne modifie pas l'original).
 * Les sessions en mode non compétitif (zen, learning, endurance) ne
 * modifient jamais les records.
 */
export function updatePersonalRecords(
  current: PersonalRecords | null,
  session: SessionResult,
): PersonalRecords {
  const records: PersonalRecords = current
    ? (JSON.parse(JSON.stringify(current)) as PersonalRecords)
    : (JSON.parse(JSON.stringify(DEFAULT_RECORDS)) as PersonalRecords);

  if (NON_COMPETITIVE_MODES.has(session.mode)) return records;

  if (session.wpmNet > records.maxWpm.value) {
    records.maxWpm = {
      value: session.wpmNet,
      sessionId: session.id,
      achievedAt: session.timestamp,
    };
  }

  if (session.accuracy > records.maxAccuracy.value) {
    records.maxAccuracy = {
      value: session.accuracy,
      sessionId: session.id,
      achievedAt: session.timestamp,
    };
  }

  if (session.consistency > records.maxConsistency.value) {
    records.maxConsistency = {
      value: session.consistency,
      sessionId: session.id,
      achievedAt: session.timestamp,
    };
  }

  if (session.duration > records.longestSession.duration) {
    records.longestSession = {
      duration: session.duration,
      sessionId: session.id,
      achievedAt: session.timestamp,
    };
  }

  if (session.collectionId) {
    const existing = records.byCollection[session.collectionId];
    if (!existing || session.wpmNet > existing.wpm) {
      records.byCollection[session.collectionId] = {
        wpm: session.wpmNet,
        achievedAt: session.timestamp,
      };
    }
  }

  return records;
}
