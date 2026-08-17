import { Midi } from '@tonejs/midi';
import {
  MIDI_PIECES,
  getLibraryIdFromMidiPieceId,
  getMidiAssetCacheVersion,
  getMidiAssetPath,
  loadPieceFromData,
  type MidiPieceId,
  type ParsedNote,
  type ParsedPiece,
} from '@typewav/audio-engine';
import {
  getCachedMidiPiece,
  invalidateCachedMidiPiece,
  setCachedMidiPiece,
} from './midi-piece-cache';

const PIANO_PROGRAMS = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
const PHRASE_BOUNDARY_THRESHOLD_MS = 150;

export type MidiAssetLoadErrorCode =
  | 'MIDI_ASSET_NOT_MAPPED'
  | 'MIDI_ASSET_ABORTED'
  | 'MIDI_ASSET_FETCH_FAILED'
  | 'MIDI_ASSET_PARSE_FAILED'
  | 'MIDI_ASSET_EMPTY_SEQUENCE'
  | 'MIDI_CANONICAL_PIECE_NOT_FOUND';

interface MidiAssetLoadErrorDetails {
  pieceId: MidiPieceId;
  canonicalPieceId: string;
  assetPath: string | null;
  detail: string;
}

export class MidiAssetLoadError extends Error {
  override readonly name = 'MidiAssetLoadError';
  override readonly cause: unknown;

  constructor(
    public readonly code: MidiAssetLoadErrorCode,
    public readonly details: MidiAssetLoadErrorDetails,
    options?: { cause?: unknown },
  ) {
    super(
      `[${code}] piece=${details.pieceId} canonical=${details.canonicalPieceId} asset=${details.assetPath ?? 'none'} detail=${details.detail}`,
    );
    this.cause = options?.cause;
  }
}

function isAbortError(cause: unknown): boolean {
  if (typeof cause !== 'object' || cause === null) return false;
  const maybeNamed = cause as { name?: unknown };
  return maybeNamed.name === 'AbortError';
}

interface LoadMidiPieceWithAssetsOptions {
  signal?: AbortSignal;
}

function ticksToSeconds(ticks: number, bpm: number, ppq: number): number {
  return (ticks / ppq) * (60 / bpm);
}

function markPhraseBoundaries(
  notes: ParsedNote[],
  bpmReference: number,
  ppq: number,
): ParsedNote[] {
  if (notes.length <= 1) return notes;

  return notes.map((note, index) => {
    if (index >= notes.length - 1) return note;

    const next = notes[index + 1]!;
    const currentEndTick = note.startTick + note.durationTicks;
    const gapTicks = Math.max(0, next.startTick - currentEndTick);
    const gapMs = ticksToSeconds(gapTicks, bpmReference, ppq) * 1000;

    return {
      ...note,
      isPhraseBoundary: gapMs > PHRASE_BOUNDARY_THRESHOLD_MS,
    };
  });
}

function selectTracksForParsing(midi: Midi): Midi['tracks'] {
  const pianoTracks = midi.tracks.filter((track) => {
    if (track.channel === 9) return false;
    const programNumber = track.instrument?.number ?? 0;
    return PIANO_PROGRAMS.has(programNumber);
  });

  if (pianoTracks.length > 0) return pianoTracks;
  if (midi.tracks.length > 0) return [midi.tracks[0]!];
  return [];
}

function buildPieceFromMidi(
  basePiece: ParsedPiece,
  rawBuffer: ArrayBuffer,
  pieceId: MidiPieceId,
  canonicalPieceId: string,
  assetPath: string,
): ParsedPiece {
  const midi = new Midi(rawBuffer);
  const ppq = midi.header.ppq || 480;
  const bpmReference = midi.header.tempos[0]?.bpm ?? 120;

  const tracksToUse = selectTracksForParsing(midi);

  const events = tracksToUse
    .flatMap((track) =>
      track.notes.map((midiNote) => {
        const durationTicks = Math.max(
          1,
          Math.round(midiNote.durationTicks || 1),
        );
        return {
          pitch: midiNote.midi,
          durationTicks,
          startTick: Math.max(0, Math.round(midiNote.ticks || 0)),
          velocity: Math.max(
            0,
            Math.min(127, Math.round((midiNote.velocity ?? 0.8) * 127)),
          ),
        } satisfies Omit<ParsedNote, 'durationSec' | 'isPhraseBoundary'>;
      }),
    )
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);

  if (events.length === 0) {
    throw new MidiAssetLoadError('MIDI_ASSET_EMPTY_SEQUENCE', {
      pieceId,
      canonicalPieceId,
      assetPath,
      detail: 'Parsed MIDI contains no playable notes.',
    });
  }

  const parsedNotes = events.map(
    (event) =>
      ({
        pitch: event.pitch,
        durationSec: ticksToSeconds(event.durationTicks, bpmReference, ppq),
        durationTicks: event.durationTicks,
        startTick: event.startTick,
        velocity: event.velocity,
        isPhraseBoundary: false,
      }) satisfies ParsedNote,
  );

  const notesWithBoundaries = markPhraseBoundaries(
    parsedNotes,
    bpmReference,
    ppq,
  );
  const last = notesWithBoundaries[notesWithBoundaries.length - 1]!;
  const totalDurationSec = ticksToSeconds(
    last.startTick + last.durationTicks,
    bpmReference,
    ppq,
  );

  return {
    ...basePiece,
    notes: notesWithBoundaries,
    bpmReference,
    ppq,
    totalDurationSec,
  };
}

/**
 * Charge une pièce uniquement depuis son asset .mid mappé.
 * En cas d'échec, lève une erreur explicite (aucun fallback silencieux).
 */
export async function loadMidiPieceWithAssets(
  pieceId: MidiPieceId,
  options: LoadMidiPieceWithAssetsOptions = {},
): Promise<ParsedPiece> {
  const { signal } = options;
  const canonicalPieceId = getLibraryIdFromMidiPieceId(pieceId);
  const basePiece = MIDI_PIECES[canonicalPieceId];

  if (!basePiece) {
    throw new MidiAssetLoadError('MIDI_CANONICAL_PIECE_NOT_FOUND', {
      pieceId,
      canonicalPieceId,
      assetPath: null,
      detail: 'Canonical piece is missing from MIDI_PIECES.',
    });
  }

  const assetPath = getMidiAssetPath(canonicalPieceId);

  if (!assetPath) {
    throw new MidiAssetLoadError('MIDI_ASSET_NOT_MAPPED', {
      pieceId,
      canonicalPieceId,
      assetPath: null,
      detail: 'No .mid asset mapping found for this piece.',
    });
  }

  const assetCacheVersion =
    getMidiAssetCacheVersion(canonicalPieceId) ?? assetPath;

  const abortedError = (detail: string, cause?: unknown) =>
    new MidiAssetLoadError(
      'MIDI_ASSET_ABORTED',
      {
        pieceId,
        canonicalPieceId,
        assetPath,
        detail,
      },
      cause === undefined ? undefined : { cause },
    );

  if (signal?.aborted) {
    throw abortedError('MIDI asset load aborted before request start.');
  }

  const cached = await getCachedMidiPiece(canonicalPieceId, assetCacheVersion);
  if (cached) {
    if (signal?.aborted) {
      throw abortedError('MIDI asset load aborted while reading cache.');
    }
    try {
      return loadPieceFromData(cached);
    } catch {
      // Entrée en cache corrompue (ex. séquence sans note exploitable,
      // reliquat d'un bug de parsing déjà corrigé) : on l'efface et on
      // retombe sur un chargement réseau propre ci-dessous, plutôt que de
      // bloquer l'utilisateur sur une erreur définitive.
      await invalidateCachedMidiPiece(canonicalPieceId);
    }
  }

  let response: Response;
  try {
    response = await fetch(assetPath, signal ? { signal } : undefined);
  } catch (cause) {
    if (signal?.aborted || isAbortError(cause)) {
      throw abortedError('MIDI asset request aborted while fetching.', cause);
    }
    throw new MidiAssetLoadError(
      'MIDI_ASSET_FETCH_FAILED',
      {
        pieceId,
        canonicalPieceId,
        assetPath,
        detail: 'Network error while fetching MIDI asset.',
      },
      { cause },
    );
  }

  if (!response.ok) {
    throw new MidiAssetLoadError('MIDI_ASSET_FETCH_FAILED', {
      pieceId,
      canonicalPieceId,
      assetPath,
      detail: `HTTP ${response.status} while fetching MIDI asset.`,
    });
  }

  try {
    const rawBuffer = await response.arrayBuffer();
    if (signal?.aborted) {
      throw abortedError('MIDI asset load aborted after fetch completion.');
    }

    const parsedPiece = buildPieceFromMidi(
      basePiece,
      rawBuffer,
      pieceId,
      canonicalPieceId,
      assetPath,
    );

    await setCachedMidiPiece(canonicalPieceId, assetCacheVersion, parsedPiece);

    if (signal?.aborted) {
      throw abortedError('MIDI asset load aborted before sequencer update.');
    }

    return loadPieceFromData(parsedPiece);
  } catch (cause) {
    if (cause instanceof MidiAssetLoadError) throw cause;

    if (signal?.aborted || isAbortError(cause)) {
      throw abortedError('MIDI asset load aborted during parsing.', cause);
    }

    throw new MidiAssetLoadError(
      'MIDI_ASSET_PARSE_FAILED',
      {
        pieceId,
        canonicalPieceId,
        assetPath,
        detail: 'Failed to parse MIDI bytes into a playable sequence.',
      },
      { cause },
    );
  }
}
