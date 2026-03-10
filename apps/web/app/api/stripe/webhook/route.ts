/**
 * Route handler — Stripe Webhook.
 *
 * POST /api/stripe/webhook
 *
 * Traite les événements Stripe :
 * - checkout.session.completed → activer le premium dans Supabase
 * - customer.subscription.deleted → désactiver le premium
 *
 * Utilise SUPABASE_SERVICE_ROLE_KEY (admin) — jamais exposée côté client.
 * Spec : docs/ARCHITECTURE.md — Variables d'environnement
 */

import { stripe } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export async function POST(request: Request): Promise<NextResponse> {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 },
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await supabase.from('user_premium').upsert({
          user_id: userId,
          is_premium: true,
          stripe_customer_id: session.customer as string,
          plan: session.metadata?.plan ?? 'monthly',
          activated_at: new Date().toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await supabase
        .from('user_premium')
        .update({ is_premium: false, deactivated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customerId);
      break;
    }

    default:
      // Ignorer les autres événements
      break;
  }

  return NextResponse.json({ received: true });
}
