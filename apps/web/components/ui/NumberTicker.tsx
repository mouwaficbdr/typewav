'use client';

/**
 * NumberTicker : compte de 0 vers `value` à l'arrivée.
 *
 * `animate={false}` (onglet en arrière-plan au montage, prefers-reduced-motion,
 * ou simplement pas voulu) : rend `value` directement, sans compte-up. Sur un
 * dashboard qu'on ouvre pour lire ses chiffres, un « 0 » qui traîne est pire
 * qu'inutile.
 */

import { animate } from 'motion/react';
import { useEffect, useState } from 'react';

interface NumberTickerProps {
  value: number;
  animate?: boolean;
  duration?: number;
  delay?: number;
  formatter?: (v: number) => string;
}

export function NumberTicker({
  value,
  animate: shouldAnimate = false,
  duration = 0.6,
  delay = 0,
  formatter = (v: number) => Math.round(v).toString(),
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value);
      return;
    }
    setDisplayValue(0);
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return () => controls.stop();
  }, [value, shouldAnimate, duration, delay]);

  return <>{formatter(displayValue)}</>;
}
