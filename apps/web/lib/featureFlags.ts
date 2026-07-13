/**
 * Feature flags — retirer la constante et ses usages une fois la feature validée en prod.
 */

/**
 * À retirer une fois la sync cloud Supabase validée opérationnelle en production.
 * Dépendances : tables `user_sessions` confirmées + integration testée end-to-end.
 */
export const SYNC_IS_COMING_SOON = true;

/**
 * true uniquement pour `next dev` — Next.js remplace process.env.NODE_ENV à
 * la compilation, donc cette constante est figée à `false` dans tout build
 * de production (`next build`/`next start`) et ne peut pas fuir en prod.
 */
export const IS_DEV_MODE = process.env.NODE_ENV === 'development';
