/**
 * lib/weekly.ts — Stats hebdomadaires + détection de plateau.
 *
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Profil & analytics
 */

import type {
  PlateauInfo,
  PlateauRecommendation,
  SessionResult,
  WeeklySummary,
} from '@typewav/types';

const PLATEAU_MIN_SESSIONS = 14;
const PLATEAU_DELTA_THRESHOLD = 2; // WPM

/**
 * Calcule le résumé hebdomadaire à partir de sessions triées par date desc.
 * La semaine courante inclut les 7 derniers jours.
 */
export function calculateWeeklySummary(
  sessions: SessionResult[],
  now = Date.now(),
): WeeklySummary {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const weekStart = now - WEEK_MS;
  const prevWeekStart = weekStart - WEEK_MS;

  const thisWeek = sessions.filter(
    (s) => s.timestamp >= weekStart && s.timestamp <= now,
  );
  const prevWeek = sessions.filter(
    (s) => s.timestamp >= prevWeekStart && s.timestamp < weekStart,
  );

  const avgWpm =
    thisWeek.length > 0
      ? Math.round(
          thisWeek.reduce((sum, s) => sum + s.wpm, 0) / thisWeek.length,
        )
      : 0;

  const prevAvgWpm =
    prevWeek.length > 0
      ? Math.round(
          prevWeek.reduce((sum, s) => sum + s.wpm, 0) / prevWeek.length,
        )
      : 0;

  const wpmDelta = avgWpm - prevAvgWpm;

  // Jour avec le plus de sessions
  const dayCount: Record<string, number> = {};
  for (const s of thisWeek) {
    const day = new Date(s.timestamp).toLocaleDateString('fr-FR', {
      weekday: 'long',
    });
    dayCount[day] = (dayCount[day] ?? 0) + 1;
  }
  const bestDay =
    Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  // Bigram le plus amélioré (approximation : bigram le plus rapide en fin de semaine)
  const mostImprovedBigram = findMostImprovedBigram(thisWeek);

  return {
    weekStart,
    sessionsCount: thisWeek.length,
    avgWpm,
    wpmDelta,
    bestDay,
    mostImprovedBigram,
  };
}

/**
 * Détecte un plateau : WPM médian stable sur au moins 14 sessions consécutives
 * (delta < 2 WPM entre le début et la fin du plateau).
 *
 * Retourne null si aucun plateau détecté.
 * Sessions passées en ordre chronologique (index 0 = plus ancienne).
 */
export function detectPlateau(sessions: SessionResult[]): PlateauInfo | null {
  if (sessions.length < PLATEAU_MIN_SESSIONS) return null;

  // Chercher la plus longue séquence consécutive avec delta < seuil
  for (
    let start = 0;
    start <= sessions.length - PLATEAU_MIN_SESSIONS;
    start++
  ) {
    const window = sessions.slice(start, start + PLATEAU_MIN_SESSIONS);
    const wpms = window.map((s) => s.wpm);
    const median = computeMedian(wpms);
    const max = Math.max(...wpms);
    const min = Math.min(...wpms);

    if (max - min < PLATEAU_DELTA_THRESHOLD) {
      const recommendation = pickRecommendation(window);
      return {
        startIndex: start,
        medianWpm: Math.round(median),
        recommendation,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

function pickRecommendation(sessions: SessionResult[]): PlateauRecommendation {
  // Heuristique simple : regarder le mode et les durations
  const avgDuration =
    sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
  const modes = sessions.map((s) => s.mode);
  const hasCode = modes.some((m) => m === 'code');
  const hasNumbers = modes.some((m) => m === 'numbers');

  if (!hasNumbers) return 'practice_numbers';
  if (!hasCode) return 'practice_bigrams';
  if (avgDuration < 60_000) return 'increase_duration';
  return 'try_new_collection';
}

function findMostImprovedBigram(sessions: SessionResult[]): string {
  if (sessions.length === 0) return '';

  // Agréger les bigrams depuis les keystrokeData
  const bigramTimes: Record<string, number[]> = {};
  for (const session of sessions) {
    const keystrokes = session.keystrokeData;
    for (let i = 1; i < keystrokes.length; i++) {
      const prev = keystrokes[i - 1];
      const curr = keystrokes[i];
      if (!prev || !curr || !curr.correct) continue;
      const bigram = prev.char + curr.char;
      bigramTimes[bigram] ??= [];
      bigramTimes[bigram]!.push(curr.deltaMs);
    }
  }

  // Bigram avec la meilleure amélioration relative de vitesse (deltaMs le plus bas)
  const avgTimes = Object.entries(bigramTimes)
    .filter(([, times]) => times.length >= 3)
    .map(([bigram, times]) => ({
      bigram,
      avg: times.reduce((a, b) => a + b, 0) / times.length,
    }))
    .sort((a, b) => a.avg - b.avg);

  return avgTimes[0]?.bigram ?? '';
}
