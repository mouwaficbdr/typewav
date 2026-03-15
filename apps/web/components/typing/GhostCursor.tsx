'use client';

/**
 * GhostCursor — curseur fantôme qui rejoue le record personnel.
 *
 * S'affiche en overlay direct dans la zone de texte (TypingArea).
 * Avance au rythme des keystrokeTimings du record personnel passé.
 * UI puriste : un curseur semi-transparent directement sur les caractères.
 *
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Ghost mode
 */

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface GhostCursorProps {
  /** Timings inter-frappe du record personnel (ms entre chaque frappe) */
  ghostTimings: number[];
  /** Longueur totale du texte */
  textLength: number;
  /** Ref vers le conteneur des mots pour calculer les coordonnées X/Y */
  wordsRef: React.RefObject<HTMLDivElement | null>;
}

export function GhostCursor({
  ghostTimings,
  textLength,
  wordsRef,
}: GhostCursorProps) {
  const shouldReduceMotion = useReducedMotion();
  const [ghostPosition, setGhostPosition] = useState(0);
  const [cursorStyle, setCursorStyle] = useState<{ x: number; y: number; width: number; height: number; opacity: number }>({ x: 0, y: 0, width: 0, height: 0, opacity: 0 });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef(0);

  // Moteur d'avancement du fantôme
  useEffect(() => {
    if (ghostTimings.length === 0) return;

    posRef.current = 0;

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

    // Un petit délai avant de démarrer pour que le DOM soit prêt
    const startTimer = setTimeout(() => {
      advance();
    }, 100); // 100ms de grâce

    return () => {
      clearTimeout(resetTimer);
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ghostTimings, textLength]);

  // Positionnement dynamique du curseur fantôme
  useLayoutEffect(() => {
    if (!wordsRef.current) return;
    
    // Le conteneur principal
    const wordsEl = wordsRef.current;
    
    // On cherche l'élément caractère cible
    // Note: On cible char-X en priorité.
    const targetEl = wordsEl.querySelector(`[data-testid="char-${ghostPosition}"]`) as HTMLElement;
    
    if (targetEl) {
      const parentRect = wordsEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // Coordonnées relatives au conteneur 'wordsRef'
      const x = targetRect.left - parentRect.left;
      const y = targetRect.top - parentRect.top;
      
      setCursorStyle({
        x,
        y,
        width: targetRect.width,
        height: targetRect.height,
        opacity: ghostPosition >= textLength ? 0 : 1, // On le cache à la fin
      });
    }
  }, [ghostPosition, textLength, wordsRef]);

  // Si on n'a pas encore de dimensions, on ne rend rien pour éviter un flash
  if (cursorStyle.width === 0) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: Math.max(cursorStyle.width, 12), // Minimum width pour les espaces
        height: cursorStyle.height,
        // UI Puriste MonkeyType: un bloc semi-transparent au-dessus du texte
        background: 'color-mix(in srgb, var(--color-text-muted) 35%, transparent)',
        borderRadius: 'var(--radius-sm)',
        pointerEvents: 'none', // Ne doit pas bloquer les clics
        zIndex: 1, // Au-dessus du conteneur texte mais discret
      }}
      animate={{
        x: cursorStyle.x,
        y: cursorStyle.y,
        opacity: cursorStyle.opacity,
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              type: 'tween',
              ease: 'linear',
              duration: 0.1, // Fluide entre chaque frappe
            }
      }
    />
  );
}
