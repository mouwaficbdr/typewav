# Melody Verification Protocol

This protocol enforces that playable melodies are not altered between the library and the player layer.

## What is guaranteed now

- The MIDI player uses the 58 canonical entries from `MUSIC_LIBRARY` as source of truth.
- Legacy IDs are aliases to canonical IDs, with identical notes and durations.
- CI test guardrails ensure no transformation can silently rewrite notes.

See tests:

- `packages/audio-engine/src/__tests__/melody-integrity.test.ts`

## What still requires external musicological validation

The checks above guarantee technical integrity (no internal falsification), but they do not prove historical/authentic transcription against an external reference corpus.

To certify authenticity piece-by-piece:

1. Define one public reference source per piece (IMSLP/MIDI source + version).
2. Store provenance metadata per piece (source URL, editor, revision date).
3. Run human review + A/B playback comparison before merge.
4. Lock approved revisions with mandatory review on melody changes.
