'use client';

/**
 * useSession — orchestration complète d'un test de typing.
 *
 * Responsabilités :
 * - Calcule WPM / accuracy / consistency en temps réel (toutes les secondes)
 * - Gère la fin de session (sauvegarde IndexedDB + navigation résultats)
 * - Expose les stats live aux composants consommateurs
 *
 * Spec : docs/WORKFLOW.md — Custom hooks (orchestrent logique pure + état React/Zustand)
 */

import { useProgressionCheck } from '@/hooks/useProgressionCheck';
import { saveSession } from '@/lib/db';
import {
  calculateAccuracy,
  calculateConsistency,
  calculateWPM,
  calculateWPMNet,
  generateRecommendation,
} from '@/lib/stats';
import { useAudioStore } from '@/stores/useAudioStore';
import { useSessionStore } from '@/stores/useSessionStore';
import type { KeystrokeEntry, SessionResult, TypingMode } from '@typewav/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface LiveStats {
  wpm: number;
  accuracy: number;
  consistency: number;
}

interface UseSessionOptions {
  text: string;
  mode?: TypingMode | undefined;
  collectionId?: string | undefined;
  /** Si true, navigue automatiquement vers /results en fin de session */
  autoNavigate?: boolean | undefined;
}

export function useSession({
  text,
  mode = 'classic',
  collectionId,
  autoNavigate = true,
}: UseSessionOptions) {
  const router = useRouter();
  const {
    position,
    keystrokes,
    startedAt,
    endedAt,
    soundPackId,
    themeId,
    startSession,
    recordKeystroke,
    moveBack,
    endSession,
    reset,
  } = useSessionStore();
  const { themeId: audioThemeId } = useAudioStore();
  const { runAfterSession } = useProgressionCheck();

  const [liveStats, setLiveStats] = useState<LiveStats>({
    wpm: 0,
    accuracy: 100,
    consistency: 100,
  });

  // Ref pour l'intervalle de mise à jour des stats live
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Démarrer la session quand le texte change
  useEffect(() => {
    startSession(text, {
      mode,
      ...(collectionId !== undefined ? { collectionId } : {}),
      soundPackId,
      themeId: audioThemeId,
    });
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mettre à jour les stats live toutes les secondes
  useEffect(() => {
    if (startedAt === null || endedAt !== null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (startedAt ?? now);
      if (elapsed < 1000 || keystrokes.length === 0) return;

      setLiveStats({
        wpm: calculateWPM(keystrokes, elapsed),
        accuracy: calculateAccuracy(keystrokes),
        consistency: calculateConsistency(keystrokes),
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, endedAt, keystrokes]);

  // Fin de session : sauvegarder + naviguer
  useEffect(() => {
    if (endedAt === null || startedAt === null) return;

    const duration = endedAt - startedAt;
    const wpm = calculateWPM(keystrokes, duration);
    const wpmNet = calculateWPMNet(keystrokes, duration);
    const accuracy = calculateAccuracy(keystrokes);
    const consistency = calculateConsistency(keystrokes);

    const sessionResult: SessionResult = {
      id: crypto.randomUUID(),
      timestamp: startedAt,
      wpm,
      wpmNet,
      accuracy,
      consistency,
      duration,
      mode,
      themeId,
      ...(collectionId !== undefined ? { collectionId } : {}),
      soundPackId,
      keystrokeData: keystrokes,
      text,
    };

    const recommendation = generateRecommendation(sessionResult);

    saveSession(sessionResult).then((id) => {
      // Progression : rang + jalons + records (async, n'attend pas)
      void runAfterSession(sessionResult);

      if (!autoNavigate) return;

      // Encoder les stats essentielles dans l'URL (le détail est en DB)
      const params = new URLSearchParams({
        id,
        wpm: String(Math.round(wpm)),
        wpmNet: String(Math.round(wpmNet)),
        accuracy: String(Math.round(accuracy)),
        consistency: String(Math.round(consistency)),
        recommendation,
      });
      router.push(`/results?${params.toString()}`);
    });
  }, [endedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeystroke = useCallback(
    (key: string) => {
      if (endedAt !== null) return;

      const expected = text[position];
      if (!expected) return;

      const isCorrect = key === expected;
      const now = Date.now();
      const previousTimestamp =
        keystrokes.length > 0
          ? (keystrokes[keystrokes.length - 1] as KeystrokeEntry).timestamp
          : now;

      recordKeystroke({
        char: key,
        timestamp: now,
        correct: isCorrect,
        deltaMs: now - previousTimestamp,
      });
    },
    [position, text, keystrokes, endedAt, recordKeystroke],
  );

  const handleBackspace = useCallback(() => {
    if (endedAt !== null) return; // session terminée
    if (position === 0 && keystrokes.length === 0) return; // rien à effacer
    moveBack();
  }, [endedAt, position, keystrokes.length, moveBack]);

  return {
    position,
    keystrokes,
    liveStats,
    isActive: startedAt !== null && endedAt === null,
    isComplete: endedAt !== null,
    handleKeystroke,
    handleBackspace,
    reset,
    endSession,
  };
}
