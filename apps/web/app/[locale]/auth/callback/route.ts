/**
 * Route GET — Supabase Auth Callback.
 *
 * Traite le retour OAuth et les confirmations d'email.
 * Échange le code d'autorisation contre une session.
 *
 * Spec : docs/ARCHITECTURE.md — @supabase/ssr
 */

import { getSafeRedirectPath } from '@/lib/safe-redirect';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // En cas d'erreur, rediriger vers le login avec un message
  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_failed`,
  );
}
