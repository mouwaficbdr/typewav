/**
 * Middleware Next.js — combinaison next-intl (i18n) + Supabase (session refresh).
 *
 * Ordre :
 * 1. Supabase rafraîchit le token si nécessaire (cookies)
 * 2. next-intl applique le routing de locale
 *
 * Spec : docs/ARCHITECTURE.md — @supabase/ssr
 */

import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Rafraîchir la session Supabase (ne bloque pas si les variables ne sont pas définies)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // Rafraîchir le token sans bloquer si l'auth n'est pas configurée
    await supabase.auth.getUser();
  }

  // Appliquer le routing i18n de next-intl
  const intlResponse = intlMiddleware(request);
  if (intlResponse) {
    // Transférer les cookies Supabase dans la réponse i18n
    for (const cookie of response.cookies.getAll()) {
      intlResponse.cookies.set(cookie);
    }
    return intlResponse;
  }

  return response;
}

export const config = {
  // Exclure _next, api, et fichiers statiques
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
