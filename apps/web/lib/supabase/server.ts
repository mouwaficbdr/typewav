/**
 * Supabase SSR — client côté serveur.
 *
 * À utiliser uniquement dans :
 * - Server Components
 * - API Routes (Route Handlers)
 * - Server Actions
 *
 * Spec : docs/ARCHITECTURE.md — Supabase uniquement pour premium
 * Règle absolue : SUPABASE_SERVICE_ROLE_KEY jamais exposée côté client.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll peut échouer dans un Server Component en lecture seule.
            // Ignoré — le middleware gère le rafraîchissement des tokens.
          }
        },
      },
    },
  );
}

/**
 * Client admin avec service role — UNIQUEMENT dans des Route Handlers sécurisés.
 * Ne jamais exposer cette clé côté client.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: { getAll: () => [], setAll: () => undefined },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
