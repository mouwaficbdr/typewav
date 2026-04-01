/**
 * midi-player.ts — Séquenceur MIDI pour la bibliothèque complète.
 *
 * Source de vérité: MUSIC_LIBRARY (58 pièces).
 * Compatibilité legacy: anciens IDs conservés via alias dans loadPiece().
 */

import { MUSIC_LIBRARY } from './library';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MidiPiece {
  id: MidiPieceId;
  title: string;
  composer: string;
  year: number;
  notes: string[];
  /** Durée de chaque note en notation Tone.js (ex: '16n'). */
  noteDuration: string;
}

export interface SequencedMidiNote {
  note: string;
  duration: string;
}

/**
 * MidiPieceId est ouvert pour supporter la librairie complète + alias legacy.
 */
export type MidiPieceId = string;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_DURATIONS = new Set(['1n', '2n', '4n', '8n', '16n', '32n']);

function normalizeDuration(value: string | undefined): string {
  if (!value) return '16n';
  return VALID_DURATIONS.has(value) ? value : '16n';
}

function toPlayableNotes(notes: Array<string | 'rest'>): string[] {
  return notes.filter((n): n is string => typeof n === 'string');
}

// Alias historiques pour ne pas casser les anciens appels/API/tests.
const LEGACY_ID_ALIASES: Record<string, string> = {
  'prelude-bwv846': 'bwv846',
  'gymnopedie-1': 'gymnopedie1',
  'nocturne-op9-n2': 'nocturne-op9-2',
  'canon-pachelbel': 'canon-in-d',
};

function resolvePieceId(pieceId: MidiPieceId): string {
  return LEGACY_ID_ALIASES[pieceId] ?? pieceId;
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

export const MIDI_PIECES: Record<string, MidiPiece> = Object.fromEntries(
  MUSIC_LIBRARY.map((piece) => {
    const firstDuration = piece.durations?.[0];
    const normalizedId = piece.id;

    return [
      normalizedId,
      {
        id: normalizedId,
        title: piece.title,
        composer: piece.composer,
        // Le catalogue est domaine public; année non fournie au niveau library.
        year: 1900,
        notes: toPlayableNotes(piece.notes),
        noteDuration: normalizeDuration(firstDuration),
      } satisfies MidiPiece,
    ];
  }),
);

// ─── Séquenceur ───────────────────────────────────────────────────────────────

interface MidiSequencerState {
  piece: MidiPiece | null;
  position: number;
}

const _state: MidiSequencerState = {
  piece: null,
  position: 0,
};

function setStatePiece(piece: MidiPiece): MidiPiece {
  const normalizedPiece: MidiPiece = {
    ...piece,
    notes: [...piece.notes],
    noteDuration: normalizeDuration(piece.noteDuration),
  };

  if (normalizedPiece.notes.length === 0) {
    throw new Error(`MIDI piece has no playable notes: ${piece.id}`);
  }

  _state.piece = normalizedPiece;
  _state.position = 0;
  return normalizedPiece;
}

/**
 * Charge une pièce MIDI et réinitialise la position.
 */
export function loadPiece(pieceId: MidiPieceId): MidiPiece {
  const resolvedId = resolvePieceId(pieceId);
  const piece = MIDI_PIECES[resolvedId];

  if (!piece) {
    throw new Error(`Unknown MIDI piece id: ${pieceId}`);
  }

  return setStatePiece(piece);
}

/**
 * Charge une pièce construite dynamiquement (ex: parsing d'un .mid externe).
 */
export function loadPieceFromData(piece: MidiPiece): MidiPiece {
  return setStatePiece(piece);
}

/**
 * Retourne la note courante et avance d'un cran, en boucle.
 */
export function advanceAndGet(): string | null {
  const step = advanceAndGetWithDuration();
  return step?.note ?? null;
}

/**
 * Retourne atomiquement la note et sa durée, issues de la même version de pièce.
 */
export function advanceAndGetWithDuration(): SequencedMidiNote | null {
  if (!_state.piece) return null;

  const pieceSnapshot = _state.piece;
  const note = pieceSnapshot.notes[_state.position] ?? null;
  _state.position = (_state.position + 1) % pieceSnapshot.notes.length;

  if (!note) return null;

  return {
    note,
    duration: pieceSnapshot.noteDuration,
  };
}

/**
 * Retourne la pièce actuellement chargée.
 */
export function getCurrentPiece(): MidiPiece | null {
  return _state.piece;
}

/**
 * Retourne la position courante dans la séquence.
 */
export function getCurrentPosition(): number {
  return _state.position;
}

/**
 * Retourne la durée de la note courante (fallback 16n).
 */
export function getCurrentDuration(): string {
  return _state.piece?.noteDuration ?? '16n';
}

/**
 * Réinitialise la position à 0 sans changer la pièce.
 */
export function resetSequence(): void {
  _state.position = 0;
}

/**
 * Supprime la pièce chargée pour empêcher toute lecture implicite.
 */
export function clearLoadedPiece(): void {
  _state.piece = null;
  _state.position = 0;
}
