/**
 * session-verdict — une phrase honnête sur la séance qu'on vient de jouer.
 *
 * Fonction pure : on lit la suite de frappes et deux métriques déjà calculées,
 * on renvoie LE fait le plus saillant de la session (un seul). C'est ce qui
 * rend l'écran de résultats non mécanique : la phrase change d'une session à
 * l'autre. Le composant traduit `kind` en texte localisé (namespace
 * `results.verdict.*`).
 *
 * Priorité (du plus « titre » au plus neutre) :
 *   brief → flawless → fatigue → accelerated → hesitation → accuracy →
 *   metronomic → clean
 */

import type { KeystrokeEntry } from '@typewav/types';

export type SessionVerdict =
  | { kind: 'brief' }
  | { kind: 'flawless' }
  | { kind: 'fatigue'; dropPct: number }
  | { kind: 'accelerated'; gainPct: number }
  | { kind: 'hesitation'; count: number }
  | { kind: 'accuracy'; errors: number }
  | { kind: 'metronomic' }
  | { kind: 'clean' };

export interface SessionVerdictInput {
  keystrokes: readonly KeystrokeEntry[];
  /** Précision globale de la session, 0-100. */
  accuracy: number;
  /** Régularité de la vitesse, 0-100. */
  consistency: number;
}

/** En dessous, la session est trop courte pour un verdict sérieux. */
const MIN_KEYSTROKES = 12;
/** Ralentissement 1re → 2e moitié à partir duquel on parle de fatigue. */
const FATIGUE_DROP_PCT = 12;
/** Accélération 1re → 2e moitié à partir de laquelle on la souligne. */
const ACCEL_GAIN_PCT = 8;
/** Une « longue pause » = intervalle supérieur à la médiane × ce facteur. */
const HESITATION_PAUSE_FACTOR = 3;
/** Nombre de longues pauses à partir duquel on parle d'hésitations. */
const HESITATION_MIN = 3;
/** Précision en dessous de laquelle la précision devient le sujet. */
const ACCURACY_FLOOR = 92;
/** Régularité au-dessus de laquelle on félicite le tempo. */
const METRONOMIC_CONSISTENCY = 90;

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

export function getSessionVerdict(input: SessionVerdictInput): SessionVerdict {
  const { keystrokes, accuracy, consistency } = input;

  if (keystrokes.length < MIN_KEYSTROKES) return { kind: 'brief' };

  const errors = keystrokes.reduce((n, k) => (k.correct ? n : n + 1), 0);
  if (errors === 0) return { kind: 'flawless' };

  // Intervalles réels entre frappes : on saute la 1re (son `deltaMs` est le
  // temps avant la première touche, pas un intervalle de frappe) et les zéros.
  const intervals = keystrokes
    .slice(1)
    .map((k) => k.deltaMs)
    .filter((d) => d > 0);

  // ── Fatigue / accélération : moyenne des intervalles, 1re vs 2e moitié ──
  if (intervals.length >= MIN_KEYSTROKES) {
    const mid = Math.floor(intervals.length / 2);
    const first = mean(intervals.slice(0, mid));
    const second = mean(intervals.slice(mid));
    if (first > 0) {
      const change = (second - first) / first; // > 0 : 2e moitié plus lente
      if (change >= FATIGUE_DROP_PCT / 100) {
        return { kind: 'fatigue', dropPct: Math.round(change * 100) };
      }
      if (change <= -ACCEL_GAIN_PCT / 100) {
        return { kind: 'accelerated', gainPct: Math.round(-change * 100) };
      }
    }
  }

  // ── Hésitations : pics d'intervalle bien au-dessus de la médiane ──
  if (intervals.length >= HESITATION_MIN) {
    const med = median(intervals);
    if (med > 0) {
      const pauses = intervals.filter(
        (d) => d > med * HESITATION_PAUSE_FACTOR,
      ).length;
      if (pauses >= HESITATION_MIN) return { kind: 'hesitation', count: pauses };
    }
  }

  if (accuracy < ACCURACY_FLOOR) return { kind: 'accuracy', errors };
  if (consistency >= METRONOMIC_CONSISTENCY) return { kind: 'metronomic' };
  return { kind: 'clean' };
}
