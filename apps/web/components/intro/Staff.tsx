'use client';

import { motion, useReducedMotion } from 'motion/react';

export interface StaffHead {
  id: string;
  note: string;
  faded?: boolean;
}

interface StaffProps {
  /** Écran courant, 1 à 6 : pilote la progression et la mesure affichée. */
  step: number;
  /** Têtes de note posées par l'écran courant (vide hors écran 2). */
  heads: StaffHead[];
}

const LINE_COUNT = 5;
const LINE_GAP = 10;
const LINE_TOP = 30;
const PROGRESS_COUNT = 6;
const VIEW_HEIGHT = 120;

/** Hauteur approximative de chaque note sur la portée, do4 grave au do5 aigu. */
const NOTE_Y: Record<string, number> = {
  A2: LINE_TOP + LINE_GAP * 7,
  C4: LINE_TOP + LINE_GAP * 4,
  D4: LINE_TOP + LINE_GAP * 3.5,
  'D#4': LINE_TOP + LINE_GAP * 3.5,
  E4: LINE_TOP + LINE_GAP * 3,
  F4: LINE_TOP + LINE_GAP * 2.5,
  G4: LINE_TOP + LINE_GAP * 2,
  A4: LINE_TOP + LINE_GAP * 1.5,
  B4: LINE_TOP + LINE_GAP * 1,
  C5: LINE_TOP + LINE_GAP * 0.5,
  'D#5': LINE_TOP - LINE_GAP * 0.5,
  D5: LINE_TOP,
  E5: LINE_TOP - LINE_GAP * 1,
};

/**
 * La portée : fil conducteur de l'Ouverture (spec partie B, « La portée, fil
 * conducteur »). Cinq lignes très fines qui traversent l'écran, six notes de
 * progression (une par écran), et les têtes de note posées par l'écran 2.
 */
export function Staff({ step, heads }: StaffProps) {
  const reduceMotion = useReducedMotion() === true;

  return (
    <div
      data-part="staff"
      data-staff-step={step}
      data-note-heads={heads.length}
      aria-hidden="true"
      style={{ position: 'relative', width: '100%', height: VIEW_HEIGHT }}
    >
      <svg
        width="100%"
        height={VIEW_HEIGHT}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {Array.from({ length: LINE_COUNT }, (_, i) => {
          const y = LINE_TOP + i * LINE_GAP;
          return reduceMotion ? (
            <line
              key={i}
              x1="0"
              x2="100%"
              y1={y}
              y2={y}
              stroke="var(--color-text-muted)"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ) : (
            <motion.line
              key={i}
              x1="0"
              x2="100%"
              y1={y}
              y2={y}
              stroke="var(--color-text-muted)"
              strokeOpacity={0.35}
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}

        {Array.from({ length: PROGRESS_COUNT }, (_, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'current' : 'todo';
          const cx = `${((i + 1) / (PROGRESS_COUNT + 1)) * 100}%`;
          return (
            <circle
              key={i}
              data-progress-state={state}
              cx={cx}
              cy={LINE_TOP + LINE_GAP * 2}
              r={4}
              fill={
                state === 'todo'
                  ? 'transparent'
                  : state === 'current'
                    ? 'var(--color-accent)'
                    : 'var(--color-text-primary)'
              }
              stroke={state === 'todo' ? 'var(--color-text-muted)' : 'none'}
              strokeWidth={state === 'todo' ? 1.5 : 0}
            />
          );
        })}

        {heads.map((head) =>
          reduceMotion ? (
            <circle
              key={head.id}
              data-head-note={head.note}
              cx="50%"
              cy={NOTE_Y[head.note] ?? LINE_TOP + LINE_GAP * 2}
              r={5}
              fill="var(--color-accent)"
              opacity={head.faded ? 0 : 1}
            />
          ) : (
            <motion.circle
              key={head.id}
              data-head-note={head.note}
              cy={NOTE_Y[head.note] ?? LINE_TOP + LINE_GAP * 2}
              r={5}
              fill="var(--color-accent)"
              initial={{ cx: '50%', opacity: 1 }}
              animate={{ cx: '20%', opacity: head.faded ? 0 : 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          ),
        )}
      </svg>
    </div>
  );
}
