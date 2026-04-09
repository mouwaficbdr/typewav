/**
 * music-catalog.ts — unification catalogue musical et lecture MIDI.
 */

import { MUSIC_LIBRARY, type MusicPiece } from './library';
import { getMidiAssetPath } from './midi-assets';
import { MIDI_PIECES, type MidiPieceId } from './midi-player';

export interface UnifiedMusicPiece extends MusicPiece {
  midiPieceId: MidiPieceId | null;
  isPlayableNow: boolean;
}

/**
 * Pont explicite entre les IDs legacy et les IDs de la librairie.
 */
export const MIDI_TO_LIBRARY_ID: Record<string, string> = {
  'gymnopedie-1': 'gymnopedie1',
  'canon-pachelbel': 'canon-in-d',
};

const LIBRARY_TO_MIDI_ID = new Map<string, MidiPieceId>(
  Object.entries(MIDI_TO_LIBRARY_ID).map(([midiId, libraryId]) => [
    libraryId,
    midiId as MidiPieceId,
  ]),
);

export function getMidiPieceIdFromLibraryId(
  libraryId: string,
): MidiPieceId | null {
  if (MIDI_PIECES[libraryId]) return libraryId;
  return LIBRARY_TO_MIDI_ID.get(libraryId) ?? null;
}

export function getLibraryIdFromMidiPieceId(pieceId: MidiPieceId): string {
  return MIDI_TO_LIBRARY_ID[pieceId] ?? pieceId;
}

export function getUnifiedMusicLibrary(): UnifiedMusicPiece[] {
  return MUSIC_LIBRARY.map((piece) => {
    const midiPieceId = getMidiPieceIdFromLibraryId(piece.id);
    const hasMappedAsset =
      midiPieceId !== null && getMidiAssetPath(midiPieceId) !== null;

    return {
      ...piece,
      midiPieceId,
      isPlayableNow:
        midiPieceId !== null &&
        Boolean(MIDI_PIECES[midiPieceId]) &&
        hasMappedAsset,
    };
  });
}

export function getPlayableMusicLibrary(): UnifiedMusicPiece[] {
  return getUnifiedMusicLibrary().filter((piece) => piece.isPlayableNow);
}

export function getUnifiedPieceByMidiId(
  pieceId: MidiPieceId,
): UnifiedMusicPiece | null {
  const libraryId = getLibraryIdFromMidiPieceId(pieceId);
  const piece = MUSIC_LIBRARY.find((entry) => entry.id === libraryId);
  if (!piece) return null;

  const canonicalMidiId = getMidiPieceIdFromLibraryId(libraryId);
  const hasMappedAsset =
    canonicalMidiId !== null && getMidiAssetPath(canonicalMidiId) !== null;

  return {
    ...piece,
    midiPieceId: pieceId,
    isPlayableNow: hasMappedAsset,
  };
}

export function isMidiPieceMapped(pieceId: MidiPieceId): boolean {
  const libraryId = getLibraryIdFromMidiPieceId(pieceId);
  const canonicalMidiId = getMidiPieceIdFromLibraryId(libraryId);

  return (
    Boolean(MIDI_PIECES[libraryId]) &&
    canonicalMidiId !== null &&
    getMidiAssetPath(canonicalMidiId) !== null
  );
}
