# Error-echo recalibration — Design

**Goal:** Replace the current "erreur = silence total" audio behavior with a graceful three-tier diminuendo: the last correctly-played note echoes back (attenuated, more reverb-washed) on the first two consecutive errors, then falls to true silence on the third and beyond — resetting instantly to normal playback on the next correct keystroke. Never plays a note that isn't in the piece; only modulates volume/reverb on a note that already earned its place.

**Architecture:** New error-tracking state (`consecutiveErrorCount`, `lastPlayedNote`, `lastEchoTriggerTime`) added to the existing `VoiceEngine` singleton in `apps/web/hooks/useAudioEngine.ts`. `triggerSilence()` is renamed `triggerErrorEcho()` and gains the tiered logic. A throttle (~120ms) decouples the error *counter* (which can climb arbitrarily fast under rapid mistyping) from actual audio *triggering* (which never stacks/overlaps), so panic-mashing wrong keys converges to silence cleanly instead of producing a muddy pile of overlapping echoes.

**Tech Stack:** Tone.js (`Sampler`/`Synth`/`Reverb`), Zustand (`useAudioStore`), Vitest with `vi.useFakeTimers()` and the existing mocked-`tone` test harness in `apps/web/hooks/__tests__/useAudioEngine.test.ts`.

## Global Constraints

- **Never a wrong note.** The echo replays the exact pitch of `lastPlayedNote` — never re-processed through `applyTypingExpression`, never a different pitch. This is the one non-negotiable inherited from the existing "erreur = silence" rule (CLAUDE.md) — we're softening the *execution*, not the invariant.
- **Cursor/timer/session mechanics are untouched.** This is a pure audio-layer change. The cursor still advances on every keystroke (correct or not, as today); session timers (Classic/Sprint) keep running through any silence — confirmed with the user: the timer reflects real time spent on the exercise, no pause is warranted.
- **Backspace-driven correction is a separate circuit.** `apps/web/lib/correction-echo.ts` / `triggerResume()` (the existing reverb-boost-on-correction cue) is unchanged and unaffected. Backspace never increments `consecutiveErrorCount`.
- **Same threshold in every mode**, including Apprentissage (Learning), for this v1 — confirmed with the user. No per-mode tuning of the "3 errors → silence" threshold; revisit as a separate iteration if real usage shows it's too harsh for beginners.

---

## Background

Confirmed with the user during brainstorming (this session, following the "Document de Conception : Logique Musicale et Interactive" the user wrote):

1. The user's document proposed two loosely-coupled ideas: (a) a new error-recalibration audio model, and (b) a new falling-note rhythm-guide visualization. These are two separate design cycles — **this spec covers (a) only.** The visual rhythm guide is a distinct future brainstorm.
2. The user's document also raised a broader question — should the falling-note guide *judge* timing (a real rhythm-game gate) or purely *reflect* the user's live typing cadence (zero judgment)? Resolved: the product's DNA stays "zero judgment / flow" (Option A) for the core experience; a judged rhythm-precision mode may exist later as a distinct, opt-in mode — not the default. This framing informs (but doesn't block) the present spec: the error-echo system must never feel like a penalty, only a gentle signal.
3. "Recalibrage en fondu" does **not** mean the MIDI sequencer rewinds — today the sequencer only ever advances on a correct keystroke, so there's nothing to rewind. It means: replay the last note that *did* successfully play, faded down, instead of silence.
4. "Le morceau se met en pause" after 3 consecutive errors affects **audio feedback only** — not the cursor, not the test, not the timer. This preserves the existing "cursor always advances, even on error" invariant untouched; only what you *hear* changes.
5. Rapid-fire wrong keystrokes (the user's own concern, raised unprompted) must never stack overlapping echoes or glitch the reverb automation. Resolved via the counter/audio-trigger throttle described below.

## Components

### `VoiceEngine` new state (`apps/web/hooks/useAudioEngine.ts`)

```ts
interface LastPlayedNote {
  pitch: string; // Tone.js note name, post-applyTypingExpression — literally what sounded
  duration: string; // Tone.js duration string used for the original triggerAttackRelease
  velocity: number; // normalized 0-1, as used originally
}

class VoiceEngine {
  // ...existing fields...
  lastPlayedNote: LastPlayedNote | null = null;
  consecutiveErrorCount = 0;
  lastEchoTriggerTime = 0; // ms, from a monotonic clock (Tone.now() * 1000 or performance.now())
}
```

`lastPlayedNote` is written at the end of `playParsedNote()` (the function that already exists and triggers every real, correct note) — immediately after a successful `triggerAttackRelease`, capture the exact `noteToPlay`/`duration`/`velocity` that were used. `consecutiveErrorCount` resets to `0` there too, in the same place — a correct keystroke always clears the streak, whether or not this is the first note of the session.

### Tiered echo logic — `triggerErrorEcho()` (replaces `triggerSilence()`)

```ts
const ECHO_TIERS = [
  { volumeScale: 0.6, reverbWetBoost: 0.5, durationScale: 1.0 }, // 1st consecutive error
  { volumeScale: 0.35, reverbWetBoost: 0.65, durationScale: 1.3 }, // 2nd consecutive error
]; // 3rd and beyond: no entry → silence
const ECHO_THROTTLE_MS = 120;

triggerErrorEcho(): void {
  this.consecutiveErrorCount += 1;

  const tier = ECHO_TIERS[this.consecutiveErrorCount - 1];
  if (!tier || !this.lastPlayedNote) return; // 3rd+ error, or nothing to echo yet: true silence

  const now = performance.now();
  if (now - this.lastEchoTriggerTime < ECHO_THROTTLE_MS) return; // swallow, counter already moved
  this.lastEchoTriggerTime = now;

  if (!useAudioStore.getState().initialized) return;

  const voice = this.sampler ?? this.fallbackSynth;
  if (!voice) return;

  const { pitch, duration, velocity } = this.lastPlayedNote;
  const baselineWet = (PACK_CONFIGS[this.loadedPack] ?? DEFAULT_PACK_CONFIG).reverbWet;

  this.reverb?.wet.rampTo(tier.reverbWetBoost, 0.05);
  this.reverb?.wet.rampTo(baselineWet, 0.4, `+0.05`); // Tone.js relative-time offset

  // No `await loadTone()` needed here: unlike playParsedNote, this only calls
  // methods on already-constructed instances (this.reverb, this.sampler /
  // this.fallbackSynth) — no Tone.* namespace call, so no fresh import.
  // Time param omitted (not passed): Tone.js schedules against "now" by
  // default, same effective behavior as playParsedNote's explicit Tone.now().
  voice.triggerAttackRelease(
    pitch,
    scaleDuration(duration, tier.durationScale), // helper: multiplies a Tone.js duration string
    undefined,
    velocity * tier.volumeScale,
  );
}
```

Note: `triggerErrorEcho()` is synchronous (unlike today's `triggerSilence`, which is also synchronous — no behavior-visible async change), keeping `TypingArea.tsx`'s call site (`triggerSilence()` → `triggerErrorEcho()`) a drop-in rename plus the new tiered body. No change to `handleKeyDown`'s control flow.

### Reset points

`consecutiveErrorCount` and `lastPlayedNote` must clear whenever a fresh attempt starts, so a stale echo from a previous piece/session never bleeds into a new one. Reset alongside the existing `resetSequence()` call:

- `TypingArea.tsx`'s mount effect (`useEffect(() => { resetSequence(); }, [])`) gains a companion call, e.g. `engine.resetErrorEcho()` (new small method: `resetErrorEcho(): void { this.lastPlayedNote = null; this.consecutiveErrorCount = 0; }`).
- `loadMidiPiece`'s success path (`useAudioEngine.ts`) also calls it — a mid-session piece change (via the piece selector) must not let the old piece's last note echo into the new one.

### Edge cases

- **No note played yet** (very first keystroke of a session is wrong): `lastPlayedNote` is `null` → `triggerErrorEcho()` falls through to true silence immediately, same as today's behavior. No special-case code needed — the existing `if (!tier || !this.lastPlayedNote) return;` guard covers it.
- **Sound pack changed mid-session**: the echo plays on `this.sampler ?? this.fallbackSynth` — whichever is *currently* loaded — never the pack that was active when the original note played. Consistent with how a normal note already behaves.
- **Engine not yet initialized**: same guard pattern as the existing `triggerResume()` (`if (!useAudioStore.getState().initialized) return;`).
- **Rapid mistyping**: covered by `ECHO_THROTTLE_MS` above — the counter (and therefore the eventual transition to silence) is unaffected by the throttle; only redundant audio triggers are swallowed. A user mashing 5 wrong keys in 200ms hears at most one or two echo pulses, then silence — never a stacked pile of overlapping notes.

## Testing

New test cases in `apps/web/hooks/__tests__/useAudioEngine.test.ts` (or a dedicated file if the existing one is getting large), using the established mocked-`tone` + `vi.useFakeTimers()` pattern already in this file:

1. First correct note played → `lastPlayedNote` captured (assert via a subsequent error's echo pitch matching it).
2. 1st consecutive error → echo triggers at tier-1 volume/reverb, same pitch as the last correct note.
3. 2nd consecutive error → echo triggers at tier-2 volume/reverb (fainter than tier-1).
4. 3rd consecutive error → no `triggerAttackRelease` call at all (true silence).
5. A correct keystroke after a streak of errors → `consecutiveErrorCount` resets to 0; the *next* error after that starts again at tier-1.
6. Error before any note has ever played → no `triggerAttackRelease` call (silence, `lastPlayedNote` is null).
7. Two errors within `ECHO_THROTTLE_MS` of each other → only one `triggerAttackRelease` call (the second is swallowed by the throttle), but `consecutiveErrorCount` still reaches 2. Verified by a third error arriving right after: it must produce true silence (count = 3), not a tier-1 echo — proving the throttled second error still incremented the counter even though its audio was suppressed.
8. New piece loaded mid-session → `lastPlayedNote`/`consecutiveErrorCount` reset (an error right after the piece change produces silence, not an echo of the old piece's last note).

## Out of scope (this spec)

- The falling-note rhythm-guide visualization (separate future design cycle).
- Any true MIDI-sequencer rewind/replay of multiple notes back.
- Per-mode tuning of the error threshold (e.g., a gentler curve for Apprentissage) — ship uniform first, revisit with real usage data.
- Any change to Backspace/`correction-echo.ts` behavior.
