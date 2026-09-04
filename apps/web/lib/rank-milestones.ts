/**
 * rank-milestones : repérer, dans l'historique, la séance qui a fait franchir
 * chaque palier de rang pour la première fois.
 *
 * Proxy visuel volontairement simple : « première séance dont le WPM atteint
 * le seuil du palier ». Ce n'est pas la logique exacte de progression.ts
 * (qui roule sur une médiane), mais c'est déterministe, honnête (« le jour où
 * tu as touché ce niveau pour la première fois ») et suffisant pour poser un
 * marqueur de moment-clé sur Le Rouleau.
 *
 * Logique pure, pas d'import React.
 */

import { RANKS, type RankTier, type SessionResult } from '@typewav/types';

/**
 * @param sessions - ordre ascendant par timestamp (comme getSessions)
 * @returns pour chaque palier atteint, l'id de la séance qui l'a franchi
 */
export function firstSessionIdPerTier(
  sessions: readonly SessionResult[],
): Partial<Record<RankTier, string>> {
  const tiers = (Object.keys(RANKS) as RankTier[]).filter(
    (t) => RANKS[t].minWpm > 0,
  );
  const result: Partial<Record<RankTier, string>> = {};
  for (const tier of tiers) {
    const threshold = RANKS[tier].minWpm;
    const hit = sessions.find((s) => s.wpm >= threshold);
    if (hit) result[tier] = hit.id;
  }
  return result;
}

/** Les ids de séances marquées comme montée de rang (dédupliqués). */
export function rankUpSessionIds(
  sessions: readonly SessionResult[],
): string[] {
  return [...new Set(Object.values(firstSessionIdPerTier(sessions)))];
}
