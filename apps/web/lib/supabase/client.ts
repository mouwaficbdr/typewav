'use client';

/**
 * Supabase SSR — client côté navigateur.
 *
 * À utiliser uniquement dans des Client Components authentifiés.
 * Jamais directement import @supabase/supabase-js.
 *
 * Spec : docs/ARCHITECTURE.md — Supabase uniquement pour premium
 * 'use client' implicite : ce singleton ne doit être instancié que côté client.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Singleton client navigateur — réutilise la même instance entre renders.
 * Retourne null si les variables d'environnement ne sont pas définies
 * (développement local sans Supabase configuré).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return _client;
}
