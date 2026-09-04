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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface LiveStats {
  wpm: number;
  accuracy: number;
  consistency: number;
}

interface FinalStats {
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
}

interface UseSessionOptions {
  text: string;
  mode?: TypingMode | undefined;
  collectionId?: string | undefined;
  durationSeconds?: number | undefined;
  /** Si true, navigue automatiquement vers /results en fin de session */
  autoNavigate?: boolean | undefined;
  /**
   * Si false, la session n'est ni sauvegardée (IndexedDB) ni comptée pour la
   * progression (rang, jalons, records) : la séance ne laisse aucune trace.
   * Utilisé pour Zen, où la promesse produit est justement l'absence de
   * notation.
   */
  trackProgress?: boolean | undefined;
}

export function useSession({
  text,
  mode = 'classic',
  collectionId,
  durationSeconds = 60,
  autoNavigate = true,
  trackProgress = true,
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
  // Lu via ref (pas comme dépendance de l'effet ci-dessous) : changer le
  // thème audio en cours de frappe est un réglage à chaud, pas le signal
  // d'un nouveau test — il ne doit jamais réinitialiser la séance en cours.
  const audioThemeIdRef = useRef(audioThemeId);
  useEffect(() => {
    audioThemeIdRef.current = audioThemeId;
  });

  const [liveStats, setLiveStats] = useState<LiveStats>({
    wpm: 0,
    accuracy: 100,
    consistency: 100,
  });
  // Distinct de liveStats (mis à jour au mieux toutes les 1s pendant la
  // frappe) : dérivé directement de keystrokes/startedAt/endedAt, donc
  // disponible dès le rendu où la séance se termine — un exercice qui finit
  // avant le premier tick périodique (fréquent sur un texte court)
  // laisserait sinon liveStats.wpm à sa valeur initiale de 0 au moment où
  // les composants consommateurs lisent le WPM final.
  const finalStats = useMemo<FinalStats | null>(() => {
    if (endedAt === null || startedAt === null) return null;
    const duration = endedAt - startedAt;
    return {
      wpm: calculateWPM(keystrokes, duration),
      wpmNet: calculateWPMNet(keystrokes, duration),
      accuracy: calculateAccuracy(keystrokes),
      consistency: calculateConsistency(keystrokes),
    };
  }, [endedAt, startedAt, keystrokes]);

  // Ref pour l'intervalle de mise à jour des stats live
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // `keystrokes` change de référence à chaque frappe : le lire via un ref
  // (plutôt que comme dépendance de l'effet ci-dessous) permet à
  // l'intervalle de survivre à la frappe continue au lieu d'être détruit
  // et recréé avant d'avoir jamais atteint son propre délai d'1s.
  const keystrokesRef = useRef(keystrokes);
  useEffect(() => {
    keystrokesRef.current = keystrokes;
  });

  // Démarrer la session quand le texte change
  useEffect(() => {
    startSession(text, {
      mode,
      ...(collectionId !== undefined ? { collectionId } : {}),
      soundPackId,
      themeId: audioThemeIdRef.current,
    });
  }, [text, mode, collectionId, soundPackId, startSession]);

  // `endedAt` déjà non-null au tout premier rendu = le store porte encore une
  // séance terminée d'un exercice précédent (on arrive sur /fr depuis /results,
  // typiquement via « Encore »). L'effet « Démarrer la session » ci-dessus la
  // réinitialise ; il ne faut alors PAS re-naviguer vers /results (sinon on
  // rebondit une fois sur le récap avant de revenir à l'exercice). La garde se
  // lève dès que la séance est ré-armée : la prochaine vraie fin navigue bien.
  const skipEndNavRef = useRef(endedAt !== null);
  useEffect(() => {
    if (endedAt === null) skipEndNavRef.current = false;
  }, [endedAt]);

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
      const currentKeystrokes = keystrokesRef.current;
      if (elapsed < 1000 || currentKeystrokes.length === 0) return;

      setLiveStats({
        wpm: calculateWPM(currentKeystrokes, elapsed),
        accuracy: calculateAccuracy(currentKeystrokes),
        consistency: calculateConsistency(currentKeystrokes),
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, endedAt]);

  // Durée de session: appliquer un timeout pour les modes chronométrés.
  useEffect(() => {
    const isTimedMode = mode === 'classic' || mode === 'challenge';
    if (!isTimedMode) return;
    if (startedAt === null || endedAt !== null) return;

    const deadline = startedAt + durationSeconds * 1000;
    const remainingMs = Math.max(0, deadline - Date.now());

    if (remainingMs === 0) {
      endSession();
      return;
    }

    const timeout = setTimeout(() => {
      endSession();
    }, remainingMs);

    return () => clearTimeout(timeout);
  }, [mode, durationSeconds, startedAt, endedAt, endSession]);

  // Compte à rebours visible pour les modes chronométrés (audit configbar,
  // décision 1) : avant, rien n'affichait le temps restant, seul repère de
  // fin en mode Temps. `durationSeconds` tant que la séance n'a pas
  // commencé (le timer démarre à la première frappe, voir startSession) ;
  // ticke ensuite chaque seconde jusqu'à 0, calé sur le même `startedAt` que
  // le timeout ci-dessus donc jamais en désaccord avec la fin réelle.
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    null,
  );
  useEffect(() => {
    const isTimedMode = mode === 'classic' || mode === 'challenge';

    // setState jamais synchrone dans le corps de l'effet
    // (react-hooks/set-state-in-effect) : les deux branches "valeur statique"
    // passent par une microtâche, comme ailleurs dans ce fichier/le reste du
    // code (voir ScrambleText, AmbientAura).
    if (!isTimedMode) {
      queueMicrotask(() => setSecondsRemaining(null));
      return;
    }
    if (startedAt === null || endedAt !== null) {
      queueMicrotask(() => setSecondsRemaining(durationSeconds));
      return;
    }

    const tick = () => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      setSecondsRemaining(
        Math.max(0, Math.ceil(durationSeconds - elapsedSeconds)),
      );
    };
    // Premier tick dans un callback d'intervalle (pas le corps de l'effet) :
    // setInterval(tick, 1000) appellerait tick() seulement après 1s, donc un
    // setTimeout(tick, 0) affiche la valeur juste dès ce même tour d'event
    // loop plutôt que d'attendre la première seconde pleine.
    const firstTick = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, [mode, durationSeconds, startedAt, endedAt]);

  // Fin de session : sauvegarder + naviguer
  useEffect(() => {
    if (endedAt === null || startedAt === null || !finalStats) return;
    if (skipEndNavRef.current) return; // séance périmée au montage, pas de rebond
    if (!trackProgress) return; // Zen : ni sauvegarde ni progression

    const duration = endedAt - startedAt;
    const { wpm, wpmNet, accuracy, consistency } = finalStats;

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
        mode,
        duration: String(duration),
        recommendation,
      });
      if (collectionId !== undefined) {
        params.set('collection', collectionId);
      }

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
    finalStats,
    secondsRemaining,
    isActive: startedAt !== null && endedAt === null,
    isComplete: endedAt !== null,
    handleKeystroke,
    handleBackspace,
    reset,
    endSession,
  };
}
