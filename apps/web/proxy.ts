/**
 * Middleware Next.js : routing de locale next-intl.
 *
 * La v1 n'a pas de comptes : plus de rafraîchissement de session Supabase ici.
 */

import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export const proxy = createIntlMiddleware(routing);

export const config = {
  // Exclure _next, api, et fichiers statiques
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
