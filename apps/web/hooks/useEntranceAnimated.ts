'use client';

/**
 * useEntranceAnimated : true seulement si une animation d'entrée peut
 * réellement se dérouler et être vue.
 *
 * Faux quand l'onglet est en arrière-plan au montage (`document.hidden` :
 * requestAnimationFrame est suspendu, une entrée en `opacity: 0` resterait
 * bloquée à zéro et l'écran serait blanc) ou quand l'utilisateur a demandé
 * moins de mouvement. Dans ces deux cas, les composants doivent rendre
 * directement leur état final.
 *
 * Extrait de ResultsPage (même besoin sur l'écran de résultats).
 */

import { useReducedMotion } from 'motion/react';
import { useState } from 'react';

export function useEntranceAnimated(): boolean {
  const reduceMotion = useReducedMotion();
  const [visibleAtMount] = useState(
    () => typeof document !== 'undefined' && !document.hidden,
  );
  return visibleAtMount && !reduceMotion;
}
