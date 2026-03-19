/**
 * music-catalog.ts — unification catalogue musical (58 pièces) et lecture MIDI (8 pièces).
 */

import { MUSIC_LIBRARY, type MusicPiece } from './library';
import { MIDI_PIECES, type MidiPieceId } from './midi-player';

export interface UnifiedMusicPiece extends MusicPiece {
  midiPieceId: MidiPieceId | null;
  isPlayableNow: boolean;
}

/**
 * Pont explicite entre les IDs MIDI historiques et les IDs de la librairie unifiée.
 */
export const MIDI_TO_LIBRARY_ID: Record<MidiPieceId, string> = {
  'fur-elise': 'fur-elise',
  'prelude-bwv846': 'bwv846',
  'gymnopedie-1': 'gymnopedie1',
  korobeiniki: 'korobeiniki',
  'ode-to-joy': 'ode-to-joy',
  'nocturne-op9-n2': 'nocturne-op9-2',
  'rondo-alla-turca': 'rondo-alla-turca',
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
  return LIBRARY_TO_MIDI_ID.get(libraryId) ?? null;
}

export function getLibraryIdFromMidiPieceId(pieceId: MidiPieceId): string {
  return MIDI_TO_LIBRARY_ID[pieceId];
}

export function getUnifiedMusicLibrary(): UnifiedMusicPiece[] {
  return MUSIC_LIBRARY.map((piece) => {
    const midiPieceId = getMidiPieceIdFromLibraryId(piece.id);
    return {
      ...piece,
      midiPieceId,
      isPlayableNow: midiPieceId !== null,
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

  return {
    ...piece,
    midiPieceId: pieceId,
    isPlayableNow: true,
  };
}

export function isMidiPieceMapped(pieceId: MidiPieceId): boolean {
  return Boolean(MIDI_PIECES[pieceId] && MIDI_TO_LIBRARY_ID[pieceId]);
}
