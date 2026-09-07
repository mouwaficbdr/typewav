'use client';

/**
 * useMediaQuery : `true` quand la media query correspond. SSR-safe (démarre à
 * `false`, se synchronise au montage puis écoute les changements). Défensif si
 * `matchMedia` est absent (jsdom, très vieux navigateurs) : reste `false`.
 *
 * Branchement de comportement, pas une mesure de layout : c'est le bon outil
 * pour choisir un rendu selon la largeur (ex. repli du rail de niveaux du mode
 * Apprentissage sous ~900px).
 */

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return;
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [query]);

  return matches;
}
