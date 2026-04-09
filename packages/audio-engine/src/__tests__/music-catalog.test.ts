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
  it('maintient les alias legacy nécessaires', () => {
    expect(MIDI_TO_LIBRARY_ID['gymnopedie-1']).toBe('gymnopedie1');
    expect(MIDI_TO_LIBRARY_ID['canon-pachelbel']).toBe('canon-in-d');
  });

  it('résout les correspondances aller-retour pour un ID MIDI', () => {
    const libraryId = getLibraryIdFromMidiPieceId('canon-pachelbel');
    expect(libraryId).toBe('canon-in-d');
    expect(getMidiPieceIdFromLibraryId(libraryId)).toBe('canon-in-d');
  });

  it('retourne un ID MIDI pour toute pièce de librairie', () => {
    expect(getMidiPieceIdFromLibraryId('ave-maria')).toBe('ave-maria');
  });

  it('retourne une vue unifiée de 24 pièces avec 24 pièces jouables', () => {
    const all = getUnifiedMusicLibrary();
    const playable = all.filter((piece) => piece.isPlayableNow);
    expect(all).toHaveLength(24);
    expect(playable).toHaveLength(24);
  });

  it('expose directement la liste jouable', () => {
    const playable = getPlayableMusicLibrary();
    expect(playable).toHaveLength(24);
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
