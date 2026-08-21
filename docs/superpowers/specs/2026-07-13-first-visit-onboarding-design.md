# First-visit onboarding gate — Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** LearningMode (the "Home Row"/tutorial mode) should appear automatically exactly once — the very first time a user ever opens TypeWav — and otherwise only when manually selected from the ConfigBar, with no special onboarding framing in that second case.

**Architecture:** A persisted `has_completed_onboarding` boolean (IndexedDB, via the existing `setPreference`/`getPreference` generic preference store) gates a `HomeClient`-level effect that forces `activeMode` to `'learning'` on first load only. `LearningMode` gets two new props (`isOnboarding?: boolean`, `onExitTutorial: () => void`, required) so the exact same component renders in both the onboarding case and the manually-selected case, differing only by whether a "Passer le tutoriel" button is present.

**Tech Stack:** Next.js App Router, React 19, Zustand (`useConfigStore`), IndexedDB via `idb` (`apps/web/lib/db.ts`), Vitest + Testing Library, `fake-indexeddb` for persistence tests.

## Global Constraints

- Persistence is IndexedDB only — no `localStorage`/`sessionStorage` (project rule, CLAUDE.md).
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — optional props use the `...(x !== undefined ? { x } : {})` spread pattern already used throughout the codebase, never `x: undefined`.
- TDD: every new function gets a failing test first (see CONTRIBUTING.md / this repo's established practice this session).
- Fail open, never trap the user: any error reading the onboarding flag must default to "onboarding already done" (skip the forced redirect), never to a state the user can't exit.

---

## Background

Confirmed with the user during brainstorming:

1. LearningMode must appear automatically in exactly two cases: (a) the very first time the app is ever opened, and (b) when the user manually selects "Apprentissage" from the ConfigBar. No other automatic triggering.
2. In case (b), there is **no** onboarding framing at all — LearningMode behaves exactly as it does today (already fixed this session: dev-mode bypass, honest progress bar, persisted level progress, tutorial-complete CTA).
3. In case (a), the *same* LearningMode component renders, with one addition: a "Passer le tutoriel" button, always visible for the duration of the onboarding, that immediately exits to classic mode.
4. For that button to be meaningful, the ConfigBar (and other mode/piece/context selectors) must be hidden during onboarding — otherwise a user could already leave via any other mode pill, making the dedicated button redundant. Confirmed by the user: hide them during onboarding; they return to normal the moment onboarding ends (skip or real completion).
5. Completing the tutorial for real (the existing "🎉 Tutoriel terminé" CTA, added earlier this session) must also mark onboarding as done — whether the user arrived there via onboarding or via manual selection. There is exactly one "has this user been onboarded" flag; both exit paths (skip, real completion) set it.
6. Failure mode: if reading the persisted flag fails (IndexedDB unavailable), never force onboarding — default to normal classic-mode behavior. A user must never be trapped.

## Components

### `apps/web/lib/onboarding.ts` (new)

Mirrors the shape of `apps/web/lib/learning-progress.ts`'s persistence half — a tiny, directly-testable wrapper around the existing generic preference store.

```ts
const ONBOARDING_KEY = 'has_completed_onboarding';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await getPreference<boolean>(ONBOARDING_KEY);
  return value === true;
}

export async function markOnboardingComplete(): Promise<void> {
  await setPreference(ONBOARDING_KEY, true);
}
```

No new IndexedDB store/version bump needed — `user_preferences` already exists and is exactly what it's for.

### `apps/web/components/modes/LearningMode.tsx` (extend)

Two new props on the existing component (one optional, one required):

```ts
interface LearningModeProps {
  /** true only when auto-triggered on first visit; controls whether the skip button renders. */
  isOnboarding?: boolean;
  /**
   * Called when the user explicitly skips (isOnboarding only) OR finishes the
   * tutorial for real (always, in both onboarding and manual-selection cases).
   * Marks onboarding complete and returns to classic mode.
   */
  onExitTutorial: () => void;
}

export function LearningMode({ isOnboarding = false, onExitTutorial }: LearningModeProps) {
```

`onExitTutorial` is **required**, not optional — `HomeClient` always provides it, regardless of whether this particular render is the onboarding one or a manually-selected one (per point 5: manual completion also marks onboarding done). This keeps `LearningMode` simple: it never contains onboarding-marking logic itself, it just calls the one callback it's given, and no longer needs `useConfigStore` directly.

Rendering changes:
- Near the existing dev-mode banner, above the level title: when `isOnboarding` is true, render a persistent "Passer le tutoriel" button that calls `onExitTutorial()`. **Not** gated by level/progress — always present for the whole onboarding session, independent of `canUnlockNext`/`tutorialComplete`.
- The existing "🎉 Tutoriel terminé" CTA's button changes from `onClick={() => setActiveMode('classic')}` to `onClick={onExitTutorial}` — `LearningMode` no longer needs `useConfigStore` directly for this purpose.

### `apps/web/components/typing/HomeClient.tsx` (extend)

New state: `isOnboarding` (boolean, default `false`). No separate "has the check resolved yet" flag is needed — before the check resolves, `isOnboarding` is still `false`, which renders exactly like the normal default (classic mode, `ConfigBar` visible); it only flips once the check comes back `false` (onboarding not yet done), at which point the render moves into the onboarding state. No third state, no loading flash to special-case.

New effect, mounted once:
```ts
useEffect(() => {
  let cancelled = false;
  hasCompletedOnboarding()
    .then((done) => {
      if (cancelled || done) return;
      setIsOnboarding(true);
      setActiveMode('learning');
    })
    .catch(() => {
      // Fail open: never force onboarding if we can't confirm its state.
    });
  return () => {
    cancelled = true;
  };
}, [setActiveMode]);

const handleExitTutorial = useCallback(() => {
  setIsOnboarding(false);
  void markOnboardingComplete();
  setActiveMode('classic');
}, [setActiveMode]);
```

Render changes:
- Pass `isOnboarding={isOnboarding} onExitTutorial={handleExitTutorial}` to `<LearningMode />` (`isOnboarding` state is always a defined boolean, never `undefined`, so no conditional-spread needed here — `exactOptionalPropertyTypes` only matters when a value could genuinely be `undefined`).
- The existing `{!isLearningMode ? (<div>...ConfigBar, ActiveSessionHeader, ContextSelectors, banners...</div>) : (<ConfigBar />)}` block's `else` branch becomes conditional on `isOnboarding` too: `: !isOnboarding ? (<ConfigBar />) : null`. Nothing else in that block changes — Zone 5 (shuffle/restart) and the footer are already unconditionally hidden whenever `isLearningMode` is true (existing behavior, untouched), so they're already correctly hidden during onboarding too.

There's no flash of "forced learning mode" before the check resolves — the effect either flips `activeMode` before the user perceives the default screen, or (if the check is slow) the user briefly sees the normal classic-mode home screen and then transitions into onboarding. This is acceptable (matches how `useSyncCloud`/other async-gated behavior already works in this codebase) and not worth adding a loading-spinner special case for.

## Data Flow

1. Fresh browser, no `user_preferences` entry for `has_completed_onboarding` yet.
2. `HomeClient` mounts, effect fires, `hasCompletedOnboarding()` resolves `false` → `isOnboarding = true`, `activeMode = 'learning'`.
3. `LearningMode` renders with `isOnboarding` → skip button visible; `HomeClient` hides `ConfigBar`.
4. User either clicks "Passer le tutoriel" at any point, or plays through to the real "Tutoriel terminé" CTA on level 5.
5. Either path calls `handleExitTutorial` → `markOnboardingComplete()` persists the flag, `activeMode` becomes `'classic'`, `isOnboarding` becomes `false` → `ConfigBar` reappears, normal app.
6. Any future visit: `hasCompletedOnboarding()` resolves `true` → nothing forced; the user reaches LearningMode only by clicking "Apprentissage" themselves, in which case `isOnboarding` is never set to `true`, so `LearningMode` renders exactly as it did before this feature (no skip button, `ConfigBar` visible) — `onExitTutorial` is still passed (required prop) and still marks the flag + switches mode, matching point 5 (manual completion also counts).

## Error Handling

- `hasCompletedOnboarding()` rejecting (IndexedDB unavailable/blocked) → caught in `HomeClient`'s effect, `isOnboarding` stays `false`, `activeMode` stays at its default (`'classic'`). No retry, no error banner — this is a soft, invisible fallback, consistent with `useUser.ts`'s existing "table inexistante ou erreur réseau → status gratuit par défaut" pattern.
- `markOnboardingComplete()` rejecting on exit → not awaited/blocked on; `activeMode` still switches to `'classic'` immediately (the user must never be stuck waiting on a write). Worst case: onboarding re-triggers on a later visit, which is a minor annoyance, not a broken state.

## Testing

- `apps/web/lib/__tests__/onboarding.test.ts` (new): `hasCompletedOnboarding()` returns `false` before any save; `markOnboardingComplete()` then `hasCompletedOnboarding()` returns `true`. Mirrors the persistence tests already in `learning-progress.test.ts`.
- `apps/web/components/__tests__/HomeClient.test.tsx` (extend): mock `@/lib/onboarding`'s two functions (partial mock pattern already used for `@/lib/learning-progress` in `LearningMode.test.tsx`).
  - `hasCompletedOnboarding` resolves `false` → `LearningMode` receives `isOnboarding=true`, `ConfigBar` not rendered.
  - `hasCompletedOnboarding` resolves `true` → `LearningMode` receives no `isOnboarding` prop (or `isOnboarding=false`), `ConfigBar` rendered as today.
  - Simulating the exit callback → `markOnboardingComplete` called, `activeMode` becomes `'classic'`.
- `apps/web/components/modes/__tests__/LearningMode.test.tsx` / `LearningMode.devMode.test.tsx` (extend): skip button absent when `isOnboarding` is not passed (today's manual-selection behavior, must not regress); present and calls `onExitTutorial` when `isOnboarding=true`; the existing "tutoriel terminé" test updated to assert `onExitTutorial` is called instead of asserting a direct mode switch.

## Out of Scope (explicitly, to avoid scope creep)

- No welcome screen / intro copy before level 1 — confirmed by the user (option chosen: "just the entry + skip button").
- No changes to Zone 5 (shuffle/restart) or the footer — already hidden whenever `isLearningMode` is true, unaffected by this feature.
- No changes to `IS_DEV_MODE`'s existing level-unlock bypass — orthogonal; both can be active simultaneously in dev.
- No admin/reset affordance to re-trigger onboarding for testing — dev mode already lets a developer reach any level directly; if manual re-testing of the onboarding gate itself is needed, clearing IndexedDB (Application tab → Clear storage) is sufficient and out of scope to build a UI for.
