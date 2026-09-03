# Remove accounts and premium from v1

**Date:** 2026-09-03
**Decision (Mouwafic):** ship v1 with no accounts. Supabase, auth, Stripe, premium
and cloud sync move to a possible v2. Delete the code, do not keep it dormant.

## Why this is cheap

Auth is already almost entirely optional in the codebase:

- `useUser` returns `{ user: null, isPremium: false, loading: false }` when no
  Supabase env is set.
- `proxy.ts` skips the whole Supabase block when the env vars are absent.
- `/classement` is already a local IndexedDB leaderboard ("Phase 3"); the global
  Supabase version ("Phase 4") was never built.
- The app "runs with no env vars" by design.

So the work is: delete the dead infra, remove the UI surfaces that only make
sense with accounts, and trim ~5 components that call `useUser`.

## What stays

- **`/profil`**: local dashboard (stats, charts, records, heatmap, replays), all
  from IndexedDB. Only the premium/sync banner is removed.
- **`/classement`**: unchanged, already 100% local.
- **`pseudo`**: user-set, stored in IndexedDB, editable in `/parametres`, drives
  the "that's you" row in the local leaderboard. No account association.

## Local-first honesty (three additions)

Local data can be lost (clear site data, private window, device change, mobile
Safari 7-day eviction). Mitigations, all small:

1. **`navigator.storage.persist()`**: requested once at DB init (try/catch,
   silent). Exempts the origin from eviction on engaged sites.
2. **Export / import**: in `/parametres`: "Download my data" (JSON of every
   IndexedDB store) and "Import" (replace from that JSON). New `exportAll()` /
   `importAll(json)` in `lib/db.ts`. Doubles as the v2 migration path.
3. **Microcopy**: "Your progress is saved on this device", next to the export
   control.

## Removal inventory

**Delete:**

- `app/[locale]/auth/` (login, signup, reset-password, callback route)
- `app/[locale]/premium/` (page + client)
- `components/ui/AuthForm.tsx` + its test
- `lib/supabase/` (client + server)
- `lib/sync.ts`, `hooks/useSyncCloud.ts`
- `lib/stripe.ts`, `app/api/stripe/` (checkout, webhook, tests)

**Trim:**

- `proxy.ts`: drop the Supabase block; keep only `createIntlMiddleware(routing)`.
- `lib/security-headers.ts`: CSP loses `*.supabase.co`, `wss://*.supabase.co`,
  Stripe hosts.
- `lib/featureFlags.ts`: remove `SYNC_IS_COMING_SOON`; keep `IS_DEV_MODE`.
- `hooks/useUser.ts` becomes `usePseudo()` returning `{ pseudo }` from
  IndexedDB. Update consumers: `GlobalNav`, `ResultsPage`, `HomeClient`,
  `ProfilClient`.
- `components/ui/GlobalNav.tsx`: remove Premium entry and the login/avatar
  state. Nav = Typing · Leaderboard · Settings · Profile.
- `components/typing/ResultsPage.tsx`: remove the `loginCta` block.
- `app/[locale]/profil/ProfilClient.tsx`: remove the premium sync banner +
  `useUser`.
- `app/[locale]/transparence/page.tsx`: copy drops the premium/sync sentence and
  the Stripe cost row; reframed "free, open source, no account".
- `app/sitemap.ts`: drop `/premium`.
- `app/robots.ts`: drop `/*/auth/` (route gone).
- `messages/{fr,en}.json`: remove the `auth`, `sync`, `premium` namespaces and
  orphan keys (`results.loginCta`, `nav.login`, `nav.premium`, profile sync
  keys).
- `package.json`: remove `@supabase/ssr`, `@supabase/supabase-js`, `stripe`
  (and any `@stripe/*`).

## Launch-plan impact

- **WS-4**: the 2 RLS tasks become moot (no tables without accounts). WS-4 → 4/4,
  closed.
- **WS-7 (Premium)**: out of v1 scope; folded into a v2 note.
- The audit `.docx` and `docs/LAUNCH_PLAN.md` mention premium/Stripe throughout:
  tidy the launch plan; leave the `.docx` as historical.

## Expected side effect

Vercel blocks all deploys because the project is flagged "commercial use (Stripe,
premium)". Removing Stripe/premium should clear that flag. Mouwafic to re-check
the Vercel dashboard after the removal lands.

## Sequencing

- **PR 1 (claude):** the removal: every "delete" and "trim" above, in one PR.  A half-removed state does not build.
- **PR 2, 3, 4 (claude2):** the three additions, each testable on its own:
  `storage.persist()` at DB init; `exportAll`/`importAll` + a `DataManagement`
  panel rendered by `ParametresClient`; microcopy. claude2 owns `lib/db.ts`,
  `ParametresClient.tsx`, the new component; the ~4 new i18n keys go through
  claude (who owns `messages/*` this round).

## Testing

- Removal: `pnpm typecheck` + `pnpm build` prove no dead references. Delete tests
  of deleted files; update tests that assert login/premium.
- `exportAll` / `importAll`: round-trip test (`web-lib`, `fake-indexeddb`).
- `usePseudo` + trimmed components: update existing tests.

## v2 note (do not build now)

A v2 with accounts would re-introduce auth (Supabase or other), cloud sync of the
IndexedDB stores, and premium. The v1 export JSON is the migration seed: import
on first sign-in. Nothing in v1 should assume a server.
