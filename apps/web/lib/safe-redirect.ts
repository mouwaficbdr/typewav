/**
 * Empêche l'auth callback de rediriger vers un site externe.
 *
 * `next` vient d'un paramètre de requête non fiable. Sans validation,
 * `?next=@evil.com` ou `?next=//evil.com` change l'hôte de l'URL de
 * redirection une fois concaténé à `origin` : un utilisateur qui vient de
 * s'authentifier finit sur un site tiers.
 */
export function getSafeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith('/')) return '/';
  if (next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}
