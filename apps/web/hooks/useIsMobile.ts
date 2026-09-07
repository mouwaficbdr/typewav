'use client';

/**
 * useIsMobile : `true` sous ~600px de large. SSR-safe (démarre à `false`, se
 * synchronise au montage puis écoute les changements). Ce n'est pas une mesure
 * de layout, juste un branchement de comportement : sur mobile l'écran de
 * frappe n'a pas de focus mode, remplace les raccourcis clavier par des
 * boutons, et sert un sélecteur de morceau dédié (voir HomeClient).
 *
 * Le point de rupture 600px est le même que `.home-main` / `.mobile-typing-hint`
 * dans globals.css : une seule frontière « mobile » pour l'écran de frappe.
 */

import { useEffect, useState } from 'react';

export const MOBILE_MEDIA_QUERY = '(max-width: 600px)';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Environnements sans matchMedia (jsdom, très vieux navigateurs) : on reste
    // sur `false`. C'est un branchement de confort, jamais critique.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}
