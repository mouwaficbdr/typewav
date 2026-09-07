/**
 * Détection "classe d'appareil" pour brancher un comportement (jamais une
 * mesure de layout). Ici : couper le flow d'onboarding sur tout appareil
 * non desktop.
 *
 * "Non desktop" = appareil tactile : pointeur grossier sans survol (tous les
 * téléphones et tablettes, quelle que soit la taille d'écran), OU écran
 * étroit sous 600px (même frontière que `.home-main` / `useIsMobile`, filet
 * de sécurité si un navigateur ment sur le type de pointeur). Un laptop à
 * écran tactile reste "desktop" : son pointeur primaire est fin (trackpad).
 */

export const NON_DESKTOP_MEDIA_QUERY =
  '(hover: none) and (pointer: coarse), (max-width: 600px)';

/**
 * `true` sur téléphone et tablette. Suppose "desktop" quand il ne peut pas
 * trancher (SSR, environnement sans `matchMedia`) : le fail-safe garde le
 * comportement historique (onboarding actif) plutôt que de le couper à tort.
 */
export function isNonDesktopDevice(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(NON_DESKTOP_MEDIA_QUERY).matches;
}
