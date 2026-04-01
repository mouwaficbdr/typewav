import { Midi } from '@tonejs/midi';
import {
  MIDI_PIECES,
  getLibraryIdFromMidiPieceId,
  getMidiAssetPath,
  loadPieceFromData,
  type MidiPiece,
  type MidiPieceId,
} from '@typewav/audio-engine';

const DURATION_CANDIDATES = [
  { label: '1n', beats: 4 },
  { label: '2n', beats: 2 },
  { label: '4n', beats: 1 },
  { label: '8n', beats: 0.5 },
  { label: '16n', beats: 0.25 },
  { label: '32n', beats: 0.125 },
] as const;

const parsedMidiCache = new Map<string, MidiPiece>();

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

function inferToneDurationFromTicks(
  durationTicks: number | null,
  ppq: number,
): MidiPiece['noteDuration'] {
  if (!durationTicks || durationTicks <= 0 || ppq <= 0) return '16n';

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

function buildPieceFromMidi(
  basePiece: MidiPiece,
  rawBuffer: ArrayBuffer,
  pieceId: MidiPieceId,
  canonicalPieceId: string,
  assetPath: string,
): MidiPiece {
  const midi = new Midi(rawBuffer);
  const ppq = midi.header.ppq || 480;

  const events = midi.tracks
    .flatMap((track) =>
      track.notes.map((note) => ({
        name: note.name,
        time: note.time,
        durationTicks: note.durationTicks,
      })),
    )
    .sort((a, b) => a.time - b.time);

  const notes = events
    .map((event) => event.name)
    .filter((name): name is string => Boolean(name));

  if (notes.length === 0) {
    throw new MidiAssetLoadError('MIDI_ASSET_EMPTY_SEQUENCE', {
      pieceId,
      canonicalPieceId,
      assetPath,
      detail: 'Parsed MIDI contains no playable notes.',
    });
  }

  const nonZeroDurations = events
    .map((event) => event.durationTicks)
    .filter((value): value is number => typeof value === 'number' && value > 0)
    .sort((a, b) => a - b);

  const medianDurationTicks: number | null =
    nonZeroDurations.length > 0
      ? (nonZeroDurations[Math.floor(nonZeroDurations.length / 2)] ?? null)
      : null;

  return {
    ...basePiece,
    notes,
    noteDuration: inferToneDurationFromTicks(medianDurationTicks, ppq),
  };
}

/**
 * Charge une pièce uniquement depuis son asset .mid mappé.
 * En cas d'échec, lève une erreur explicite (aucun fallback silencieux).
 */
export async function loadMidiPieceWithAssets(
  pieceId: MidiPieceId,
  options: LoadMidiPieceWithAssetsOptions = {},
): Promise<MidiPiece> {
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

  const cached = parsedMidiCache.get(canonicalPieceId);
  if (cached) {
    if (signal?.aborted) {
      throw abortedError('MIDI asset load aborted while reading cache.');
    }
    return loadPieceFromData(cached);
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

    parsedMidiCache.set(canonicalPieceId, parsedPiece);

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
