'use client';

/**
 * useEntranceAnimated : true seulement si une animation d'entrée peut
 * réellement se dérouler et être vue.
 *
 * Retourne `false` au rendu serveur ET au premier rendu client : les deux
 * sont donc identiques (aucun mismatch d'hydratation, les compteurs affichent
 * leur vraie valeur, les `motion` sont à leur état final). L'entrée ne
 * s'arme qu'après l'hydratation, via un effet, et seulement si quelqu'un peut
 * vraiment la voir :
 *   - onglet au premier plan (`document.hidden` false : sinon
 *     requestAnimationFrame est suspendu et une entrée en `opacity: 0`
 *     resterait bloquée à zéro, écran blanc) ;
 *   - l'utilisateur n'a pas demandé moins de mouvement.
 * Sinon on reste sur l'état final, rendu directement.
 */

import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

export function useEntranceAnimated(): boolean {
  const reduceMotion = useReducedMotion();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined' || document.hidden || reduceMotion) {
      return undefined;
    }
    // Frame suivante seulement : le premier rendu client reste identique au
    // SSR (état final), l'entrée s'arme après. setState dans un callback rAF,
    // pas dans le corps de l'effet.
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  return entered;
}
