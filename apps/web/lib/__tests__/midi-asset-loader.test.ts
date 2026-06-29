import type { ParsedPiece } from '@typewav/audio-engine';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPieceFromDataMock = vi.fn<(piece: ParsedPiece) => ParsedPiece>();
const getMidiAssetCacheVersionMock =
  vi.fn<(pieceId: string) => string | null>();
const getMidiAssetPathMock = vi.fn<(pieceId: string) => string | null>();
const getLibraryIdFromMidiPieceIdMock = vi.fn<(pieceId: string) => string>();

const MIDI_PIECES_MOCK: Record<string, ParsedPiece> = {
  'fur-elise': {
    id: 'fur-elise',
    title: 'Fur Elise',
    composer: 'Beethoven',
    year: 1900,
    notes: [
      {
        pitch: 76,
        durationSec: 0.125,
        durationTicks: 120,
        startTick: 0,
        velocity: 100,
        isPhraseBoundary: false,
      },
    ],
    bpmReference: 120,
    ppq: 480,
    totalDurationSec: 0.125,
  },
};

vi.mock('@typewav/audio-engine', async () => {
  const actual = await vi.importActual('@typewav/audio-engine');
  return {
    ...actual,
    loadPieceFromData: loadPieceFromDataMock,
    getMidiAssetCacheVersion: getMidiAssetCacheVersionMock,
    getMidiAssetPath: getMidiAssetPathMock,
    getLibraryIdFromMidiPieceId: getLibraryIdFromMidiPieceIdMock,
    MIDI_PIECES: MIDI_PIECES_MOCK,
  };
});

const BASE_PIECE: ParsedPiece = {
  id: 'fur-elise',
  title: 'Für Elise',
  composer: 'Beethoven',
  year: 1900,
  notes: [
    {
      pitch: 76,
      durationSec: 0.125,
      durationTicks: 120,
      startTick: 0,
      velocity: 100,
      isPhraseBoundary: false,
    },
  ],
  bpmReference: 120,
  ppq: 480,
  totalDurationSec: 0.125,
};

describe('loadMidiPieceWithAssets', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();

    MIDI_PIECES_MOCK['fur-elise'] = BASE_PIECE;
    getLibraryIdFromMidiPieceIdMock.mockImplementation((pieceId) => pieceId);
    getMidiAssetCacheVersionMock.mockImplementation(
      () => 'fur_Elise_WoO59.mid',
    );
    loadPieceFromDataMock.mockImplementation((piece) => piece);
  });

  it('leve une erreur explicite si aucun asset n est mappe', async () => {
    getMidiAssetPathMock.mockReturnValue(null);

    const { loadMidiPieceWithAssets } = await import('../midi-asset-loader');
    await expect(loadMidiPieceWithAssets('fur-elise')).rejects.toMatchObject({
      code: 'MIDI_ASSET_NOT_MAPPED',
    });
    expect(loadPieceFromDataMock).not.toHaveBeenCalled();
  });

  it('parse un asset .mid mappe et charge la sequence extraite', async () => {
    getMidiAssetPathMock.mockReturnValue('/midi/fur_Elise_WoO59.mid');
    const midiBytes = await readFile(
      `${process.cwd()}/apps/web/public/midi/fur_Elise_WoO59.mid`,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () =>
          midiBytes.buffer.slice(
            midiBytes.byteOffset,
            midiBytes.byteOffset + midiBytes.byteLength,
          ),
      }),
    );

    const { loadMidiPieceWithAssets } = await import('../midi-asset-loader');
    const piece = await loadMidiPieceWithAssets('fur-elise');

    expect(loadPieceFromDataMock).toHaveBeenCalledTimes(1);
    expect(piece.notes.length).toBeGreaterThan(0);
    expect(piece.bpmReference).toBeGreaterThan(0);
    expect(piece.ppq).toBeGreaterThan(0);
    expect(piece.totalDurationSec).toBeGreaterThan(0);
    expect(piece.notes.every((note) => note.durationSec > 0)).toBe(true);
    expect(piece.notes.every((note) => note.durationTicks > 0)).toBe(true);
  });

  it('leve une erreur explicite si la requete est annulee', async () => {
    getMidiAssetPathMock.mockReturnValue('/midi/fur_Elise_WoO59.mid');
    const controller = new AbortController();
    controller.abort();

    const { loadMidiPieceWithAssets } = await import('../midi-asset-loader');

    await expect(
      loadMidiPieceWithAssets('fur-elise', { signal: controller.signal }),
    ).rejects.toMatchObject({
      code: 'MIDI_ASSET_ABORTED',
    });
  });

  it('leve une erreur explicite si le fetch retourne un statut HTTP non OK', async () => {
    getMidiAssetPathMock.mockReturnValue('/midi/fur_Elise_WoO59.mid');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const { loadMidiPieceWithAssets } = await import('../midi-asset-loader');

    await expect(loadMidiPieceWithAssets('fur-elise')).rejects.toMatchObject({
      code: 'MIDI_ASSET_FETCH_FAILED',
    });
  });
});
