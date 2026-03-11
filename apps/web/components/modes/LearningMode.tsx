'use client';

/**
 * LearningMode — mode d'apprentissage Home Row avec niveaux progressifs.
 *
 * Spec : docs/specs/03-training-modes.md — Mode Apprentissage
 * Client Component justifié : événements clavier, état de progression.
 */

import { KeyboardDiagram } from '@/components/modes/KeyboardDiagram';
import { TypingArea } from '@/components/typing/TypingArea';
import { generateLearningText } from '@/lib/words';
import { LEARNING_LEVELS } from '@typewav/types';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

interface LearningSessionStats {
  correct: number;
  total: number;
}

interface LevelProgress {
  levelId: number;
  accuracy: number;
  samples: number;
  unlocked: boolean;
}

export function LearningMode() {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.3;

  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>(
    LEARNING_LEVELS.map((l) => ({
      levelId: l.id,
      accuracy: 0,
      samples: 0,
      unlocked: l.id === 1,
    })),
  );
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  const [text, setText] = useState(() => generateLearningText(1));

  const currentLevel = LEARNING_LEVELS.find((l) => l.id === currentLevelId)!;
  const currentProgress = levelProgress.find(
    (p) => p.levelId === currentLevelId,
  )!;

  const progressPercent = useMemo(() => {
    if (currentProgress.samples === 0) return 0;
    return Math.round(
      (currentProgress.accuracy / currentLevel.minAccuracy) * 100,
    );
  }, [currentProgress, currentLevel]);

  const canUnlockNext = useMemo(() => {
    return (
      currentProgress.samples >= currentLevel.minSamples &&
      currentProgress.accuracy >= currentLevel.minAccuracy
    );
  }, [currentProgress, currentLevel]);

  function handleLevelSelect(levelId: number) {
    const progress = levelProgress.find((p) => p.levelId === levelId);
    if (!progress?.unlocked) return;
    setCurrentLevelId(levelId);
    setText(generateLearningText(levelId));
  }

  function handleNextLevel() {
    if (!canUnlockNext) return;
    const nextId = currentLevelId + 1;
    if (nextId > LEARNING_LEVELS.length) return;

    setLevelProgress((prev) =>
      prev.map((p) => (p.levelId === nextId ? { ...p, unlocked: true } : p)),
    );
    setCurrentLevelId(nextId);
    setText(generateLearningText(nextId));
  }

  // Régénérer le texte quand le niveau change
  useEffect(() => {
    setText(generateLearningText(currentLevelId));
  }, [currentLevelId]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
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
          return (
            <button
              key={level.id}
              onClick={() => handleLevelSelect(level.id)}
              disabled={!progress.unlocked}
              aria-label={`Niveau ${level.id} — ${level.name}`}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: isActive
                  ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                  : 'transparent',
                color: progress.unlocked
                  ? isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                cursor: progress.unlocked ? 'pointer' : 'not-allowed',
                opacity: progress.unlocked ? 1 : 0.4,
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
        text={text}
        mode="learning"
        autoNavigate={false}
        onActiveKeyChange={setActiveKey}
      />

      {/* Schéma clavier */}
      <div style={{ width: '100%' }}>
        <KeyboardDiagram
          {...(activeKey !== undefined ? { activeKey } : {})}
          {...(currentLevel.keys.length > 0
            ? { allowedKeys: currentLevel.keys }
            : {})}
        />
      </div>

      {/* Bouton débloquer niveau suivant */}
      <AnimatePresence>
        {canUnlockNext && currentLevelId < LEARNING_LEVELS.length && (
          <motion.button
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
        )}
      </AnimatePresence>
    </div>
  );
}
