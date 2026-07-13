'use client';

/**
 * LearningMode — mode d'apprentissage Home Row avec niveaux progressifs.
 *
 * Spec : docs/specs/03-training-modes.md — Mode Apprentissage
 * Client Component justifié : événements clavier, état de progression.
 */

import { KeyboardDiagram } from '@/components/modes/KeyboardDiagram';
import { TypingArea } from '@/components/typing/TypingArea';
import { IS_DEV_MODE } from '@/lib/featureFlags';
import {
  applySessionStats,
  calculateProgressPercent,
  canUnlockNextLevel,
  createInitialLevelProgress,
  loadLearningProgress,
  saveLearningProgress,
  unlockLevel,
  type LevelProgress,
} from '@/lib/learning-progress';
import { generateLearningText } from '@/lib/words';
import { useConfigStore } from '@/stores/useConfigStore';
import { LEARNING_LEVELS } from '@typewav/types';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface LearningSessionStats {
  correct: number;
  total: number;
  accuracy: number;
  wpm: number;
}

export function LearningMode() {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.3;
  const setActiveMode = useConfigStore((s) => s.setMode);

  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>(() =>
    createInitialLevelProgress(LEARNING_LEVELS),
  );
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  const [text, setText] = useState(() => generateLearningText(1));
  const [runIndex, setRunIndex] = useState(0);
  const [lastSessionStats, setLastSessionStats] =
    useState<LearningSessionStats | null>(null);

  // Charger la progression sauvegardée une seule fois au montage.
  useEffect(() => {
    let cancelled = false;
    loadLearningProgress().then((saved) => {
      if (cancelled) return;
      if (saved) setLevelProgress(saved);
      setProgressLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sauvegarder à chaque changement, une fois le chargement initial terminé —
  // sans ce garde, on écraserait la progression sauvegardée par l'état
  // initial (tout à zéro) pendant le court instant où le chargement est en vol.
  useEffect(() => {
    if (!progressLoaded) return;
    void saveLearningProgress(levelProgress);
  }, [levelProgress, progressLoaded]);

  const currentLevel = LEARNING_LEVELS.find((l) => l.id === currentLevelId)!;
  const currentProgress = levelProgress.find(
    (p) => p.levelId === currentLevelId,
  )!;

  const progressPercent = useMemo(
    () => calculateProgressPercent(currentProgress, currentLevel),
    [currentProgress, currentLevel],
  );

  const canUnlockNext = useMemo(
    () => canUnlockNextLevel(currentProgress, currentLevel),
    [currentProgress, currentLevel],
  );

  const isLastLevel = currentLevelId === LEARNING_LEVELS.length;
  const tutorialComplete = isLastLevel && canUnlockNext;

  const remainingSamples = Math.max(
    0,
    currentLevel.minSamples - currentProgress.samples,
  );
  const remainingAccuracy = Math.max(
    0,
    currentLevel.minAccuracy - currentProgress.accuracy,
  );

  function handleLevelSelect(levelId: number) {
    const progress = levelProgress.find((p) => p.levelId === levelId);
    // En développement, un niveau non gagné reste sélectionnable pour ne
    // pas devoir rejouer tous les niveaux précédents à chaque test.
    if (!progress?.unlocked && !IS_DEV_MODE) return;
    setCurrentLevelId(levelId);
    setLastSessionStats(null);
    setRunIndex((prev) => prev + 1);
    setText(generateLearningText(levelId));
  }

  function handleNextLevel() {
    if (!canUnlockNext) return;
    const nextId = currentLevelId + 1;
    if (nextId > LEARNING_LEVELS.length) return;

    setLevelProgress((prev) => unlockLevel(prev, nextId));
    setCurrentLevelId(nextId);
    setLastSessionStats(null);
    setRunIndex((prev) => prev + 1);
    setText(generateLearningText(nextId));
  }

  const handleLearningSessionComplete = useCallback(
    (stats: {
      wpm: number;
      accuracy: number;
      correct: number;
      total: number;
    }) => {
      setLastSessionStats({
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.accuracy,
        wpm: stats.wpm,
      });

      setLevelProgress((prev) =>
        applySessionStats(prev, currentLevelId, {
          correct: stats.correct,
          total: stats.total,
        }),
      );

      // Redémarre une session d'entraînement immédiatement sur le même niveau.
      setText(generateLearningText(currentLevelId));
      setRunIndex((prev) => prev + 1);
    },
    [currentLevelId],
  );

  // Régénérer le texte quand le niveau change
  useEffect(() => {
    setText(generateLearningText(currentLevelId));
  }, [currentLevelId]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {IS_DEV_MODE && (
        <div
          role="status"
          style={{
            width: '100%',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid color-mix(in srgb, orange 45%, transparent)',
            background: 'color-mix(in srgb, orange 12%, transparent)',
            color: 'orange',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          🛠 Mode développement — tous les niveaux sont sélectionnables sans
          validation des critères d&apos;accuracy/frappes. Cette vue ne
          reflète pas l&apos;expérience réelle d&apos;un nouvel utilisateur.
        </div>
      )}

      {/* Titre du niveau */}
      <div className="flex flex-col items-center gap-1">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-accent)',
            fontSize: '1.75rem',
          }}
        >
          Niveau {currentLevelId} — {currentLevel.name}
        </h2>

        {/* Progression */}
        <div className="flex items-center gap-3 mt-1">
          <div
            style={{
              width: 160,
              height: 4,
              background: 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'var(--color-accent)',
                borderRadius: 'var(--radius-sm)',
              }}
              animate={{ width: `${Math.min(100, progressPercent)}%` }}
              transition={{ duration }}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            {currentProgress.samples}/{currentLevel.minSamples} frappes •{' '}
            {currentProgress.accuracy.toFixed(0)}% précision
          </span>
        </div>
      </div>

      {/* Sélecteur de niveaux */}
      <div className="flex gap-2">
        {LEARNING_LEVELS.map((level) => {
          const progress = levelProgress.find((p) => p.levelId === level.id)!;
          const isActive = level.id === currentLevelId;
          const isSelectable = progress.unlocked || IS_DEV_MODE;
          return (
            <button
              key={level.id}
              onClick={() => handleLevelSelect(level.id)}
              disabled={!isSelectable}
              aria-label={`Niveau ${level.id} — ${level.name}`}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: isActive
                  ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                  : 'transparent',
                color: isSelectable
                  ? isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                cursor: isSelectable ? 'pointer' : 'not-allowed',
                opacity: isSelectable ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
            >
              {level.id}. {level.name}
            </button>
          );
        })}
      </div>

      {/* Zone de frappe */}
      <TypingArea
        key={`learning-${currentLevelId}-${runIndex}`}
        text={text}
        mode="learning"
        autoNavigate={false}
        onActiveKeyChange={setActiveKey}
        onSessionComplete={handleLearningSessionComplete}
      />

      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {lastSessionStats ? (
          <>
            Dernière session: {Math.round(lastSessionStats.wpm)} WPM ·{' '}
            {Math.round(lastSessionStats.accuracy)}% ({lastSessionStats.correct}
            /{lastSessionStats.total})
          </>
        ) : (
          <>
            Objectif: {currentLevel.minAccuracy}% de précision sur{' '}
            {currentLevel.minSamples} frappes.
          </>
        )}
        {!canUnlockNext && currentProgress.samples > 0 && (
          <div>
            Reste {remainingSamples} frappes et ~{Math.ceil(remainingAccuracy)}%
            de précision à atteindre.
          </div>
        )}
      </div>

      {/* Schéma clavier */}
      <div style={{ width: '100%' }}>
        <KeyboardDiagram
          {...(activeKey !== undefined ? { activeKey } : {})}
          {...(currentLevel.keys.length > 0
            ? { allowedKeys: currentLevel.keys }
            : {})}
        />
      </div>

      {/* Bouton débloquer niveau suivant / fin de tutoriel */}
      <AnimatePresence>
        {tutorialComplete ? (
          <motion.div
            key="tutorial-complete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                color: 'var(--color-text-primary)',
              }}
            >
              🎉 Tutoriel terminé ! Tu maîtrises les bases du clavier.
            </span>
            <button
              onClick={() => setActiveMode('classic')}
              style={{
                padding: '10px 24px',
                background: 'var(--color-accent)',
                color: '#000',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Passer en mode classique →
            </button>
          </motion.div>
        ) : (
          canUnlockNext && (
            <motion.button
              key="unlock-next"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration }}
              onClick={handleNextLevel}
              style={{
                padding: '10px 24px',
                background: 'var(--color-accent)',
                color: '#000',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Débloquer le niveau {currentLevelId + 1} →
            </motion.button>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
