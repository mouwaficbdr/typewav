'use client';

/**
 * GhostCursor — curseur fantôme qui rejoue le record personnel.
 *
 * S'affiche en overlay sur TypingArea.
 * Avance au rythme des keystrokeTimings du record personnel passé.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Ghost mode
 */

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface GhostCursorProps {
  /** Timings inter-frappe du record personnel (ms entre chaque frappe) */
  ghostTimings: number[];
  /** Position courante de l'utilisateur (pour comparer) */
  userPosition: number;
  /** Longueur totale du texte */
  textLength: number;
}

export function GhostCursor({
  ghostTimings,
  userPosition,
  textLength,
}: GhostCursorProps) {
  const shouldReduceMotion = useReducedMotion();
  const [ghostPosition, setGhostPosition] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef(0);

  useEffect(() => {
    if (ghostTimings.length === 0) return;

    posRef.current = 0;

    // Reset asynchrone pour éviter setState synchrone dans un effect
    const resetTimer = setTimeout(() => {
      setGhostPosition(0);
    }, 0);

    function advance() {
      const idx = posRef.current;
      if (idx >= textLength) return;

      const delay = ghostTimings[idx] ?? 200;
      timerRef.current = setTimeout(() => {
        posRef.current += 1;
        setGhostPosition(posRef.current);
        advance();
      }, delay);
    }

    advance();

    return () => {
      clearTimeout(resetTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ghostTimings, textLength]);

  // Calculer la position en pourcentage du texte
  const ghostPercent = textLength > 0 ? ghostPosition / textLength : 0;
  const userPercent = textLength > 0 ? userPosition / textLength : 0;

  const isAhead = ghostPosition > userPosition;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'var(--color-border)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      {/* Barre utilisateur */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${userPercent * 100}%`,
          background: 'var(--color-accent)',
          borderRadius: '2px',
          transition: 'width 0.1s linear',
        }}
      />

      {/* Curseur fantôme */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: `${ghostPercent * 100}%`,
          width: '3px',
          height: '100%',
          background: isAhead ? '#FFD700' : 'rgba(255,255,255,0.3)',
          borderRadius: '2px',
          transform: 'translateX(-50%)',
        }}
        animate={
          shouldReduceMotion
            ? {}
            : {
                opacity: [0.5, 1, 0.5],
              }
        }
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Label avance/retard */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: `${ghostPercent * 100}%`,
          transform: 'translateX(-50%)',
          fontSize: 10,
          color: isAhead ? '#FFD700' : 'rgba(255,255,255,0.4)',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        👻 record
      </div>
    </div>
  );
}
