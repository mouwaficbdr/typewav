-- First versioned RLS policies for TypeWav's Supabase project.
--
-- Context: `user_premium` and `user_sessions` are read and written by the
-- app today (apps/web/app/api/stripe/webhook/route.ts,
-- apps/web/hooks/useUser.ts, apps/web/lib/sync.ts) but ship with no RLS
-- policies. Without RLS, any authenticated client can read or write any
-- row in these tables via the browser Supabase client (anon/authenticated
-- key) — including another user's premium flag or session history.
--
-- This migration assumes both tables already exist in the live project
-- with at least a `user_id` column (as used by every query against them
-- in the app code) — verify column names/types against the live schema
-- before applying, since no Supabase project matching this repo was
-- connected when this migration was authored. The `::text` casts below
-- make the comparison work whether user_id is stored as uuid or text.

-- ── user_premium ─────────────────────────────────────────────────────────
-- Written only by the Stripe webhook via the service_role client, which
-- bypasses RLS by default in Supabase — no INSERT/UPDATE/DELETE policy is
-- added here, so those remain denied for the anon/authenticated roles.

alter table public.user_premium enable row level security;

create policy "Users can view their own premium status"
  on public.user_premium
  for select
  to authenticated
  using (auth.uid()::text = user_id::text);

-- ── user_sessions ────────────────────────────────────────────────────────
-- Read and written by the end user's own browser client (apps/web/lib/sync.ts),
-- so authenticated users need insert/update/select on their own rows only.
-- No delete policy: the app never deletes cloud sessions.

alter table public.user_sessions enable row level security;

create policy "Users can view their own sessions"
  on public.user_sessions
  for select
  to authenticated
  using (auth.uid()::text = user_id::text);

create policy "Users can insert their own sessions"
  on public.user_sessions
  for insert
  to authenticated
  with check (auth.uid()::text = user_id::text);

create policy "Users can update their own sessions"
  on public.user_sessions
  for update
  to authenticated
  using (auth.uid()::text = user_id::text)
  with check (auth.uid()::text = user_id::text);
