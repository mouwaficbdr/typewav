'use client';

/**
 * LevelRailSpotlight : relais du moment "Niveau N validé". Une fois l'overlay
 * dissous, isole ~1,2 s le point suivant du rail (tout le reste assombri) pour
 * que le regard, qui vient de suivre la note filer vers la gauche, se pose
 * exactement là où le pulse + la main prennent le relais.
 *
 * Les coordonnées du point cible sont mesurées par l'appelant (dans le
 * gestionnaire de fin de moment, pas un effet) et passées en props.
 *
 * `prefers-reduced-motion` : aucun assombrissement (le point pulse déjà, la
 * main pointe déjà, en version statique) ; on rend juste la main aux appelants.
 */

import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';

interface LevelRailSpotlightProps {
  /** Centre du point "prochain niveau" du rail, en pixels viewport. */
  x: number;
  y: number;
  onDone: () => void;
}

export function LevelRailSpotlight({ x, y, onDone }: LevelRailSpotlightProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!shouldReduceMotion) return;
    const timer = window.setTimeout(onDone, 900);
    return () => window.clearTimeout(timer);
  }, [shouldReduceMotion, onDone]);

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.2, times: [0, 0.18, 0.7, 1], ease: 'easeInOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 115,
        pointerEvents: 'none',
        background: `radial-gradient(circle 132px at ${x}px ${y}px, transparent 0%, transparent 40%, color-mix(in srgb, var(--color-bg) 66%, transparent) 100%)`,
      }}
    />
  );
}
