/**
 * Route handler — Stripe Checkout Session.
 *
 * POST /api/stripe/checkout
 * Body: { plan: 'monthly' | 'annual' }
 *
 * Requiert une session Supabase valide (user authentifié).
 * STRIPE_SECRET_KEY jamais exposée côté client.
 *
 * Spec : docs/ARCHITECTURE.md — Variables d'environnement
 */

import type { StripePlan } from '@/lib/stripe';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let plan: StripePlan;
  try {
    const body = (await request.json()) as { plan: unknown };
    if (body.plan !== 'monthly' && body.plan !== 'annual') {
      throw new Error('Invalid plan');
    }
    plan = body.plan;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const selectedPlan = STRIPE_PLANS[plan];
  if (!selectedPlan.priceId) {
    return NextResponse.json(
      { error: 'Price not configured' },
      { status: 503 },
    );
  }

  const origin = request.headers.get('origin') ?? 'https://typewav.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    ...(user.email ? { customer_email: user.email } : {}),
    client_reference_id: user.id,
    success_url: `${origin}/premium?success=true`,
    cancel_url: `${origin}/premium`,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
