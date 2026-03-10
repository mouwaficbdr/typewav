import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Matcher qui couvre toutes les routes sauf _next, api, et fichiers statiques
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
