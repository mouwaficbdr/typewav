import { describe, expect, it } from 'vitest';
import { MIDI_PIECES } from '../midi-player';
import {
  getLibraryIdFromMidiPieceId,
  getMidiPieceIdFromLibraryId,
  getPlayableMusicLibrary,
  getUnifiedMusicLibrary,
  getUnifiedPieceByMidiId,
  isMidiPieceMapped,
  MIDI_TO_LIBRARY_ID,
} from '../music-catalog';

describe('music-catalog bridge', () => {
  it('mappe les 8 IDs MIDI vers des IDs de librairie', () => {
    const midiIds = Object.keys(MIDI_PIECES);
    expect(Object.keys(MIDI_TO_LIBRARY_ID)).toHaveLength(midiIds.length);
    for (const midiId of midiIds) {
      expect(MIDI_TO_LIBRARY_ID).toHaveProperty(midiId);
    }
  });

  it('résout les correspondances aller-retour pour un ID MIDI', () => {
    const libraryId = getLibraryIdFromMidiPieceId('prelude-bwv846');
    expect(libraryId).toBe('bwv846');
    expect(getMidiPieceIdFromLibraryId(libraryId)).toBe('prelude-bwv846');
  });

  it('retourne null pour une pièce de librairie non jouable en MIDI', () => {
    expect(getMidiPieceIdFromLibraryId('moonlight-sonata')).toBeNull();
  });

  it('retourne une vue unifiée de 58 pièces avec 8 pièces jouables', () => {
    const all = getUnifiedMusicLibrary();
    const playable = all.filter((piece) => piece.isPlayableNow);
    expect(all).toHaveLength(58);
    expect(playable).toHaveLength(8);
  });

  it('expose directement la liste jouable', () => {
    const playable = getPlayableMusicLibrary();
    expect(playable).toHaveLength(8);
    expect(playable.every((piece) => piece.midiPieceId !== null)).toBe(true);
  });

  it('retourne une pièce unifiée à partir d’un ID MIDI', () => {
    const piece = getUnifiedPieceByMidiId('canon-pachelbel');
    expect(piece).not.toBeNull();
    expect(piece?.id).toBe('canon-in-d');
    expect(piece?.isPlayableNow).toBe(true);
  });

  it('garantit que chaque ID MIDI est déclaré comme mappé', () => {
    const midiIds = Object.keys(MIDI_PIECES) as Array<keyof typeof MIDI_PIECES>;
    for (const id of midiIds) {
      expect(isMidiPieceMapped(id)).toBe(true);
    }
  });
});
