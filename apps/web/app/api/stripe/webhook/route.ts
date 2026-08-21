/**
 * Route handler — Stripe Webhook.
 *
 * POST /api/stripe/webhook
 *
 * Traite les événements Stripe :
 * - checkout.session.completed → activer le premium dans Supabase
 * - customer.subscription.deleted → désactiver le premium
 * - customer.subscription.updated → aligner le premium sur le statut
 *   (révoqué si past_due/unpaid/canceled/incomplete_expired, restauré si actif)
 *
 * Chaque écriture en base est vérifiée : en cas d'échec, on répond une erreur
 * à Stripe pour qu'il rejoue l'événement au lieu de le considérer traité.
 * Un event.id déjà enregistré dans stripe_webhook_events n'est pas retraité.
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

const HANDLED_EVENT_TYPES = new Set<Stripe.Event['type']>([
  'checkout.session.completed',
  'customer.subscription.deleted',
  'customer.subscription.updated',
]);

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
]);

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

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    // Événement qu'on ne traite pas — rien à dédupliquer ni à écrire.
    return NextResponse.json({ received: true });
  }

  const supabase = createSupabaseAdminClient();

  const { error: dedupeError } = await supabase
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, type: event.type });

  if (dedupeError) {
    if (dedupeError.code === '23505') {
      // Déjà traité (Stripe rejoue l'événement) — ne pas retraiter.
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Impossible de garantir l'unicité du traitement : échouer pour que
    // Stripe rejoue plutôt que de risquer un double traitement silencieux.
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 },
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        const { error } = await supabase.from('user_premium').upsert({
          user_id: userId,
          is_premium: true,
          stripe_customer_id: session.customer as string,
          plan: session.metadata?.plan ?? 'monthly',
          activated_at: new Date().toISOString(),
        });
        if (error) {
          return NextResponse.json(
            { error: 'Failed to activate premium' },
            { status: 500 },
          );
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const { error } = await supabase
        .from('user_premium')
        .update({ is_premium: false, deactivated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customerId);
      if (error) {
        return NextResponse.json(
          { error: 'Failed to deactivate premium' },
          { status: 500 },
        );
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const isPremium = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
      const { error } = await supabase
        .from('user_premium')
        .update({
          is_premium: isPremium,
          ...(isPremium ? {} : { deactivated_at: new Date().toISOString() }),
        })
        .eq('stripe_customer_id', customerId);
      if (error) {
        return NextResponse.json(
          { error: 'Failed to update premium status' },
          { status: 500 },
        );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
