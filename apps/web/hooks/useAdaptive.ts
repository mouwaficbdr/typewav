'use client';

/**
 * useAdaptive — gestion de la difficulté adaptative pendant une session.
 *
 * Évalue les signaux toutes les 5 secondes et retourne l'action courante.
 * L'adaptation est totalement invisible utilisateur (pas de notification).
 *
 * Spec : docs/specs/07-adaptive-difficulty.md
 * Client Component justifié : state React, timers.
 */

import {
  evaluateAdaptation,
  filterWordsByComplexity,
  type AdaptiveAction,
  type AdaptiveSignals,
} from '@/lib/adaptive';
import type { KeystrokeEntry } from '@typewav/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAdaptiveOptions {
  /** WPM médian de la session (baseline) \u2014 mis à jour depuis useSession */
  baselineWpm: number;
  /** Keystrokes de la session courante */
  keystrokes: KeystrokeEntry[];
  /** Si true, la difficulté adaptative est active */
  enabled?: boolean;
}

interface UseAdaptiveReturn {
  /** Niveau de complexité courant (1-5) */
  complexity: number;
  /** Action d'adaptation courante */
  currentAction: AdaptiveAction;
  /** Multiplicateur de tempo audio */
  tempoMultiplier: number;
  /** Génère le prochain texte selon le niveau courant */
  getNextWords: (wordPool: string[], count?: number) => string;
}

const EVALUATION_INTERVAL_MS = 5_000;
const DEFAULT_ACTION: AdaptiveAction = {
  wordComplexity: 0,
  tempoMultiplier: 1.0,
  introduceNewCharType: false,
};

export function useAdaptive({
  baselineWpm,
  keystrokes,
  enabled = true,
}: UseAdaptiveOptions): UseAdaptiveReturn {
  const [complexity, setComplexity] = useState(3);
  const [currentAction, setCurrentAction] =
    useState<AdaptiveAction>(DEFAULT_ACTION);

  const lastChangeRef = useRef<number>(0);
  const complexityRef = useRef(3);

  // Initialiser le timestamp au montage (évite Date.now() dans useRef — règle react-hooks/purity)
  useEffect(() => {
    lastChangeRef.current = Date.now();
  }, []);

  const evaluate = useCallback(() => {
    if (!enabled || keystrokes.length < 10) return;

    // Calculer les signaux sur la fenêtre des 5 dernières secondes
    const windowMs = EVALUATION_INTERVAL_MS;
    const now = Date.now();
    const recentKeystrokes = keystrokes.filter(
      (k) => now - k.timestamp <= windowMs,
    );

    if (recentKeystrokes.length === 0) return;

    const recentCorrect = recentKeystrokes.filter((k) => k.correct).length;
    const recentAccuracy =
      recentKeystrokes.length > 0
        ? (recentCorrect / recentKeystrokes.length) * 100
        : 100;

    // WPM récent (chars / 5 / min)
    const recentDurationMs = recentKeystrokes.reduce(
      (sum, k) => sum + k.deltaMs,
      0,
    );
    const recentWpm =
      recentDurationMs > 0
        ? recentKeystrokes.length / 5 / (recentDurationMs / 60_000)
        : 0;

    // Consistance (approximation : 100 - variance normalisée)
    const deltas = recentKeystrokes.map((k) => k.deltaMs).filter((d) => d > 0);
    const avgDelta =
      deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
    const variance =
      deltas.length > 1
        ? deltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) /
          deltas.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const consistency =
      avgDelta > 0 ? Math.max(0, 100 - (stdDev / avgDelta) * 100) : 100;

    const signals: AdaptiveSignals = {
      recentWpm,
      recentAccuracy,
      consistency,
      baseline: baselineWpm || recentWpm,
      msSinceLastChange: now - lastChangeRef.current,
    };

    const action = evaluateAdaptation(signals);
    setCurrentAction(action);

    if (action.wordComplexity !== 0) {
      const newComplexity = Math.max(
        1,
        Math.min(5, complexityRef.current + action.wordComplexity),
      );
      complexityRef.current = newComplexity;
      setComplexity(newComplexity);
      lastChangeRef.current = now;
    }
  }, [enabled, keystrokes, baselineWpm]);

  // Évaluation toutes les 5 secondes
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(evaluate, EVALUATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, evaluate]);

  const getNextWords = useCallback((wordPool: string[], count = 30): string => {
    const filtered = filterWordsByComplexity(wordPool, complexityRef.current);
    const words: string[] = [];
    const pool = [...filtered];

    while (words.length < count) {
      if (pool.length === 0) pool.push(...filtered);
      const idx = Math.floor(Math.random() * pool.length);
      words.push(pool[idx] as string);
      pool.splice(idx, 1);
    }

    return words.join(' ');
  }, []);

  return {
    complexity,
    currentAction,
    tempoMultiplier: currentAction.tempoMultiplier,
    getNextWords,
  };
}
