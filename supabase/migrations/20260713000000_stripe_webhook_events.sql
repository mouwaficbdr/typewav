-- Backs the Stripe webhook's idempotency guard
-- (apps/web/app/api/stripe/webhook/route.ts): the handler inserts event_id
-- before processing and treats a unique-violation as "already processed",
-- so a replayed Stripe event is never applied twice. Only the service_role
-- (webhook) ever touches this table — RLS is enabled with no policies, so
-- anon/authenticated can neither read nor write it.

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
