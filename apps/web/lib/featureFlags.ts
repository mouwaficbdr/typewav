/**
 * Feature flags — retirer la constante et ses usages une fois la feature validée en prod.
 */

/**
 * À retirer une fois la sync cloud Supabase validée opérationnelle en production.
 * Dépendances : tables `user_sessions` confirmées + integration testée end-to-end.
 */
export const SYNC_IS_COMING_SOON = true;
