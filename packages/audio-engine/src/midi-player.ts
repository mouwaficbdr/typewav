/**
 * midi-player.ts — séquenceur MIDI piloté par notes parsées.
 *
 * Source de vérité: MUSIC_LIBRARY (fallback) + pièces parsées depuis .mid.
 * Compatibilité legacy: alias d'IDs conservés.
 */

import { MUSIC_LIBRARY } from './library';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MidiPieceId = string;

export interface ParsedNote {
  pitch: number; // MIDI note number 0-127
  durationSec: number;
  durationTicks: number;
  startTick: number;
  velocity: number; // 0-127
  isPhraseBoundary: boolean;
}

export interface ParsedPiece {
  id: MidiPieceId;
  title: string;
  composer: string;
  year: number;
  notes: ParsedNote[];
  bpmReference: number;
  ppq: number;
  totalDurationSec: number;
}

/** @deprecated Compatibilité temporaire */
export type MidiPiece = ParsedPiece;

/** @deprecated Compatibilité temporaire */
export interface SequencedMidiNote {
  note: string;
  duration: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEGACY_ID_ALIASES: Record<string, string> = {
  'gymnopedie-1': 'gymnopedie1',
  'canon-pachelbel': 'canon-in-d',
};

const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const TONE_DURATION_TO_BEATS: Record<string, number> = {
  '1n': 4,
  '2n': 2,
  '4n': 1,
  '8n': 0.5,
  '16n': 0.25,
  '32n': 0.125,
};

const DURATION_CANDIDATES = [
  { label: '1n', beats: 4 },
  { label: '2n', beats: 2 },
  { label: '4n', beats: 1 },
  { label: '8n', beats: 0.5 },
  { label: '16n', beats: 0.25 },
  { label: '32n', beats: 0.125 },
] as const;

const DEFAULT_PPQ = 480;
const DEFAULT_BPM = 120;
const PHRASE_BOUNDARY_THRESHOLD_MS = 150;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolvePieceId(pieceId: MidiPieceId): string {
  return LEGACY_ID_ALIASES[pieceId] ?? pieceId;
}

function ticksToSeconds(ticks: number, bpm: number, ppq: number): number {
  if (bpm <= 0 || ppq <= 0) return 0;
  return (ticks / ppq) * (60 / bpm);
}

function noteNameToMidi(noteName: string): number | null {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(noteName.trim());
  if (!match) return null;

  const pitchClass = match[1]?.toUpperCase() ?? '';
  const accidental = match[2] ?? '';
  const octave = Number(match[3]);
  if (!Number.isFinite(octave)) return null;

  const baseOffset = NOTE_OFFSETS[pitchClass];
  if (baseOffset === undefined) return null;

  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (octave + 1) * 12 + baseOffset + accidentalOffset;
}

function midiToNoteName(pitch: number): string {
  const clampedPitch = clamp(Math.round(pitch), 0, 127);
  const names = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];
  const note = names[clampedPitch % 12] ?? 'C';
  const octave = Math.floor(clampedPitch / 12) - 1;
  return `${note}${octave}`;
}

function durationLabelToTicks(label: string | undefined, ppq: number): number {
  const beats =
    TONE_DURATION_TO_BEATS[label ?? ''] ??
    TONE_DURATION_TO_BEATS['16n'] ??
    0.25;
  return Math.max(1, Math.round(beats * ppq));
}

function inferToneDurationFromTicks(
  durationTicks: number,
  ppq: number,
): string {
  if (durationTicks <= 0 || ppq <= 0) return '16n';

  const beats = durationTicks / ppq;
  let closest: (typeof DURATION_CANDIDATES)[number] = DURATION_CANDIDATES[4]!;
  let smallestDelta = Number.POSITIVE_INFINITY;

  for (const candidate of DURATION_CANDIDATES) {
    const delta = Math.abs(candidate.beats - beats);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      closest = candidate;
    }
  }

  return closest.label;
}

function markPhraseBoundaries(
  notes: ParsedNote[],
  bpmReference: number,
  ppq: number,
): ParsedNote[] {
  if (notes.length <= 1) return notes;

  const thresholdMs = PHRASE_BOUNDARY_THRESHOLD_MS;

  return notes.map((note, index) => {
    if (index >= notes.length - 1) {
      return { ...note, isPhraseBoundary: note.isPhraseBoundary };
    }

    const next = notes[index + 1]!;
    const currentEndTick = note.startTick + note.durationTicks;
    const gapTicks = Math.max(0, next.startTick - currentEndTick);
    const gapMs = ticksToSeconds(gapTicks, bpmReference, ppq) * 1000;

    return {
      ...note,
      isPhraseBoundary: gapMs > thresholdMs,
    };
  });
}

function normalizeNote(note: ParsedNote): ParsedNote {
  return {
    pitch: clamp(Math.round(note.pitch), 0, 127),
    durationSec: Math.max(0.01, note.durationSec),
    durationTicks: Math.max(1, Math.round(note.durationTicks)),
    startTick: Math.max(0, Math.round(note.startTick)),
    velocity: clamp(Math.round(note.velocity), 0, 127),
    isPhraseBoundary: Boolean(note.isPhraseBoundary),
  };
}

function toParsedPieceFromLibrary(
  piece: (typeof MUSIC_LIBRARY)[number],
): ParsedPiece {
  const ppq = DEFAULT_PPQ;
  const bpmReference = DEFAULT_BPM;

  const sourceDurations = piece.durations ?? [];
  const fallbackDuration = sourceDurations[0] ?? '16n';
  let tickCursor = 0;

  const parsedNotes: ParsedNote[] = [];

  piece.notes.forEach((rawNote, index) => {
    const durationLabel = sourceDurations[index] ?? fallbackDuration;
    const durationTicks = durationLabelToTicks(durationLabel, ppq);

    if (rawNote === 'rest') {
      tickCursor += durationTicks;
      return;
    }

    const pitch = noteNameToMidi(rawNote);
    if (pitch === null) {
      tickCursor += durationTicks;
      return;
    }

    parsedNotes.push({
      pitch,
      durationSec: ticksToSeconds(durationTicks, bpmReference, ppq),
      durationTicks,
      startTick: tickCursor,
      velocity: 96,
      isPhraseBoundary: false,
    });

    tickCursor += durationTicks;
  });

  const notesWithBoundaries = markPhraseBoundaries(
    parsedNotes,
    bpmReference,
    ppq,
  );
  const totalDurationSec = ticksToSeconds(tickCursor, bpmReference, ppq);

  return {
    id: piece.id,
    title: piece.title,
    composer: piece.composer,
    year: 1900,
    notes: notesWithBoundaries,
    bpmReference,
    ppq,
    totalDurationSec,
  };
}

function normalizePiece(piece: ParsedPiece): ParsedPiece {
  const ppq = Math.max(1, Math.round(piece.ppq || DEFAULT_PPQ));
  const bpmReference =
    piece.bpmReference > 0 ? piece.bpmReference : DEFAULT_BPM;
  const sorted = [...piece.notes]
    .map(normalizeNote)
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);

  if (sorted.length === 0) {
    throw new Error(`MIDI piece has no playable notes: ${piece.id}`);
  }

  const notes = markPhraseBoundaries(sorted, bpmReference, ppq);
  const finalTick =
    notes[notes.length - 1]!.startTick + notes[notes.length - 1]!.durationTicks;
  const totalDurationSec =
    piece.totalDurationSec > 0
      ? piece.totalDurationSec
      : ticksToSeconds(finalTick, bpmReference, ppq);

  return {
    ...piece,
    notes,
    ppq,
    bpmReference,
    totalDurationSec,
  };
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

export const MIDI_PIECES: Record<string, ParsedPiece> = Object.fromEntries(
  MUSIC_LIBRARY.map((piece) => {
    const parsed = toParsedPieceFromLibrary(piece);
    return [piece.id, parsed] as const;
  }),
);

// ─── Séquenceur ───────────────────────────────────────────────────────────────

interface MidiSequencerState {
  piece: ParsedPiece | null;
  position: number;
}

const _state: MidiSequencerState = {
  piece: null,
  position: 0,
};

function setStatePiece(piece: ParsedPiece): ParsedPiece {
  const normalizedPiece = normalizePiece(piece);
  _state.piece = normalizedPiece;
  _state.position = 0;
  return normalizedPiece;
}

export function loadPiece(pieceId: MidiPieceId): ParsedPiece {
  const resolvedId = resolvePieceId(pieceId);
  const piece = MIDI_PIECES[resolvedId];

  if (!piece) {
    throw new Error(`Unknown MIDI piece id: ${pieceId}`);
  }

  return setStatePiece(piece);
}

export function loadPieceFromData(piece: ParsedPiece): ParsedPiece {
  return setStatePiece(piece);
}

export function advanceAndGetNote(): ParsedNote | null {
  if (!_state.piece) return null;

  const pieceSnapshot = _state.piece;
  const next = pieceSnapshot.notes[_state.position] ?? null;
  _state.position = (_state.position + 1) % pieceSnapshot.notes.length;

  return next;
}

/** @deprecated Compatibilité temporaire */
export function advanceAndGetWithDuration(): SequencedMidiNote | null {
  const parsedNote = advanceAndGetNote();
  if (!parsedNote) return null;

  return {
    note: midiToNoteName(parsedNote.pitch),
    duration: inferToneDurationFromTicks(
      parsedNote.durationTicks,
      _state.piece?.ppq ?? DEFAULT_PPQ,
    ),
  };
}

/** @deprecated Compatibilité temporaire */
export function advanceAndGet(): string | null {
  const parsedNote = advanceAndGetNote();
  if (!parsedNote) return null;
  return midiToNoteName(parsedNote.pitch);
}

export function getCurrentPiece(): ParsedPiece | null {
  return _state.piece;
}

export function getCurrentPosition(): number {
  return _state.position;
}

/** @deprecated Compatibilité temporaire */
export function getCurrentDuration(): string {
  if (!_state.piece) return '16n';
  const note = _state.piece.notes[_state.position] ?? _state.piece.notes[0];
  if (!note) return '16n';
  return inferToneDurationFromTicks(note.durationTicks, _state.piece.ppq);
}

export function resetSequence(): void {
  _state.position = 0;
}

export function clearLoadedPiece(): void {
  _state.piece = null;
  _state.position = 0;
}
