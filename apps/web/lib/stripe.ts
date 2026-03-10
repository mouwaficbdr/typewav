/**
 * lib/stripe.ts — Client Stripe côté serveur.
 *
 * IMPORT INTERDIT côté client — server only.
 * Spec : docs/ARCHITECTURE.md — STRIPE_SECRET_KEY jamais côté client
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Vérification lazy — ne pas lever d'erreur au module load (build time)
// La validation s'effectue au niveau des route handlers qui utilisent `stripe`
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  : null;

// ─── Plans ────────────────────────────────────────────────────────────────────

export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY ?? '',
    label: 'Mensuel',
    price: 4.99,
    currency: 'eur',
    interval: 'month',
  },
  annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL ?? '',
    label: 'Annuel',
    price: 39.99,
    currency: 'eur',
    interval: 'year',
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
