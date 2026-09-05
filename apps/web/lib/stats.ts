/**
 * Calculs statistiques TypeWav : logique pure, sans état.
 * Spec : docs/specs/02-diagnostic.md
 */

import type {
  BigramStats,
  FatiguePattern,
  KeystrokeEntry,
  SessionResult,
} from '@typewav/types';

/**
 * Calcule les WPM bruts (toutes les frappes, correctes ou non).
 * Formule : (nombre total de caractères / 5) / minutes écoulées
 */
export function calculateWPM(
  keystrokes: KeystrokeEntry[],
  durationMs: number,
): number {
  if (durationMs <= 0 || keystrokes.length === 0) return 0;
  const minutes = durationMs / 60_000;
  return Math.round(keystrokes.length / 5 / minutes);
}

/**
 * Calcule les WPM nets (seuls les caractères corrects comptent).
 * Même unité que calculateWPM : aucune pénalité supplémentaire n'est
 * appliquée en plus de l'exclusion des caractères incorrects, pour éviter
 * de pénaliser deux fois la même erreur.
 * Formule : (nombre de caractères corrects / 5) / minutes écoulées
 */
export function calculateWPMNet(
  keystrokes: KeystrokeEntry[],
  durationMs: number,
): number {
  if (durationMs <= 0 || keystrokes.length === 0) return 0;
  const correctChars = keystrokes.filter((k) => k.correct).length;
  const minutes = durationMs / 60_000;
  return Math.round(correctChars / 5 / minutes);
}

/**
 * Calcule l'accuracy : pourcentage de frappes correctes / total.
 */
export function calculateAccuracy(keystrokes: KeystrokeEntry[]): number {
  if (keystrokes.length === 0) return 100;
  const correct = keystrokes.filter((k) => k.correct).length;
  return Math.round((correct / keystrokes.length) * 100 * 10) / 10;
}

/**
 * Calcule la consistance : 100 - (σWPM / μWPM × 100)
 * Découpe la session en fenêtres de windowSizeMs et calcule les WPM par fenêtre.
 */
export function calculateConsistency(
  keystrokes: KeystrokeEntry[],
  windowSizeMs = 5_000,
): number {
  if (keystrokes.length < 2) return 100;

  const start = keystrokes[0]!.timestamp;
  const end = keystrokes[keystrokes.length - 1]!.timestamp;
  const totalDuration = end - start;
  if (totalDuration < windowSizeMs) {
    // Session trop courte : un seul window
    return 100;
  }

  // Découper en fenêtres
  const windowWPMs: number[] = [];
  let windowStart = start;
  while (windowStart + windowSizeMs <= end) {
    const windowEnd = windowStart + windowSizeMs;
    const windowKs = keystrokes.filter(
      (k) => k.timestamp >= windowStart && k.timestamp < windowEnd,
    );
    windowWPMs.push(calculateWPM(windowKs, windowSizeMs));
    windowStart += windowSizeMs;
  }

  if (windowWPMs.length < 2) return 100;

  const mean = windowWPMs.reduce((a, b) => a + b, 0) / windowWPMs.length;
  if (mean === 0) return 0;

  const variance =
    windowWPMs.reduce((sum, w) => sum + (w - mean) ** 2, 0) / windowWPMs.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.round(100 - (stdDev / mean) * 100);
  return Math.max(0, Math.min(100, consistency));
}

/**
 * Détecte les 5 bigrams les plus lents (deltaMs moyen > médiane globale).
 * Retourne les bigrams triés du plus lent au plus rapide.
 */
export function detectBigramSlowdowns(
  keystrokes: KeystrokeEntry[],
): BigramStats[] {
  if (keystrokes.length < 2) return [];

  const bigramMap = new Map<string, number[]>();

  for (let i = 1; i < keystrokes.length; i++) {
    const prev = keystrokes[i - 1]!;
    const curr = keystrokes[i]!;
    if (!curr.correct || !prev.correct) continue;
    const bigram = prev.char + curr.char;
    const existing = bigramMap.get(bigram) ?? [];
    existing.push(curr.deltaMs);
    bigramMap.set(bigram, existing);
  }

  // Médiane globale de tous les deltaMs
  const allDeltas = keystrokes
    .slice(1)
    .map((k) => k.deltaMs)
    .sort((a, b) => a - b);
  const median = allDeltas[Math.floor(allDeltas.length / 2)] ?? 0;

  const stats: BigramStats[] = [];
  for (const [bigram, times] of bigramMap.entries()) {
    if (times.length === 0) continue;
    const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
    if (avgMs > median) {
      stats.push({
        bigram,
        avgMs: Math.round(avgMs),
        occurrences: times.length,
      });
    }
  }

  return stats.sort((a, b) => b.avgMs - a.avgMs).slice(0, 5);
}

/**
 * Détecte le pattern de fatigue : compare WPM 1ère moitié vs 2ème moitié.
 */
export function detectFatigue(keystrokes: KeystrokeEntry[]): FatiguePattern {
  if (keystrokes.length < 10) return 'none';

  const mid = Math.floor(keystrokes.length / 2);
  const firstHalf = keystrokes.slice(0, mid);
  const secondHalf = keystrokes.slice(mid);

  const firstStart = firstHalf[0]!.timestamp;
  const firstEnd = firstHalf[firstHalf.length - 1]!.timestamp;
  const secondStart = secondHalf[0]!.timestamp;
  const secondEnd = secondHalf[secondHalf.length - 1]!.timestamp;

  const wpmFirst = calculateWPM(firstHalf, firstEnd - firstStart);
  const wpmSecond = calculateWPM(secondHalf, secondEnd - secondStart);

  if (wpmFirst === 0) return 'none';
  const drop = (wpmFirst - wpmSecond) / wpmFirst;

  if (drop <= 0) return 'none';
  if (drop < 0.15) return 'mild';
  if (drop < 0.3) return 'moderate';
  return 'severe';
}

/**
 * Génère une recommandation textuelle actionnable basée sur la session.
 * Retourne toujours une string non vide.
 */
export function generateRecommendation(session: SessionResult): string {
  const slowBigrams = detectBigramSlowdowns(session.keystrokeData);
  const fatigue = detectFatigue(session.keystrokeData);

  if (session.accuracy < 90) {
    return `Ton accuracy est de ${session.accuracy} %. Ralentis légèrement pour consolider la précision avant de viser la vitesse.`;
  }

  if (fatigue === 'severe') {
    return `Ta vitesse chute de plus de 30 % en fin de session. Travaille des tests courts (15 s) pour maintenir le rythme.`;
  }

  if (fatigue === 'moderate') {
    return `Ta vitesse baisse en 2ème moitié de session. La régularité se construit avec la concentration, pas l'effort.`;
  }

  if (slowBigrams.length > 0) {
    const top = slowBigrams
      .slice(0, 3)
      .map((b) => `"${b.bigram}"`)
      .join(', ');
    return `Tes transitions ${top} sont lentes (${slowBigrams[0]!.avgMs} ms en moyenne). Cible ces enchaînements.`;
  }

  if (session.consistency < 70) {
    return `Ta consistance est de ${session.consistency} %. Essaie de maintenir un rythme régulier plutôt que de sprinter.`;
  }

  return `Bon test : ${session.wpm} WPM à ${session.accuracy} %. Continue à cette cadence sur des textes variés.`;
}

/** Données d'un point WPM pour le graphe de progression. Compatibles avec WpmChart. */
export interface WpmPoint {
  wordIndex: number;
  wpmRaw: number;
  wpmNet: number;
  hasError: boolean;
}

/**
 * Calcule les points WPM cumulatifs à chaque frontière de mot.
 * Chaque point correspond au WPM global jusqu'au mot i.
 */
export function calculateWpmPoints(keystrokes: KeystrokeEntry[]): WpmPoint[] {
  if (keystrokes.length < 2) return [];
  const points: WpmPoint[] = [];
  const startTime = keystrokes[0]!.timestamp;
  let wordIndex = 0;
  let wordStart = 0;

  for (let i = 0; i < keystrokes.length; i++) {
    const isSpace = keystrokes[i]!.char === ' ';
    const isLast = i === keystrokes.length - 1;

    if (isSpace || isLast) {
      const elapsed = keystrokes[i]!.timestamp - startTime;
      if (elapsed <= 0) {
        wordStart = i + 1;
        continue;
      }

      const allUpToHere = keystrokes.slice(0, i + 1);
      const wpmRaw = calculateWPM(allUpToHere, elapsed);
      const wpmNet = calculateWPMNet(allUpToHere, elapsed);
      const hasError = keystrokes
        .slice(wordStart, i + 1)
        .some((k) => !k.correct);

      points.push({ wordIndex, wpmRaw, wpmNet, hasError });
      wordIndex++;
      wordStart = i + 1;
    }
  }

  return points;
}
