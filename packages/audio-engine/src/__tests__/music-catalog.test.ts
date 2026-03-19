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
    expect(MIDI_TO_LIBRARY_ID['prelude-bwv846']).toBe('bwv846');
    expect(MIDI_TO_LIBRARY_ID['gymnopedie-1']).toBe('gymnopedie1');
  });

  it('résout les correspondances aller-retour pour un ID MIDI', () => {
    const libraryId = getLibraryIdFromMidiPieceId('prelude-bwv846');
    expect(libraryId).toBe('bwv846');
    expect(getMidiPieceIdFromLibraryId(libraryId)).toBe('bwv846');
  });

  it('retourne un ID MIDI pour toute pièce de librairie', () => {
    expect(getMidiPieceIdFromLibraryId('moonlight-sonata')).toBe(
      'moonlight-sonata',
    );
  });

  it('retourne une vue unifiée de 58 pièces avec 58 pièces jouables', () => {
    const all = getUnifiedMusicLibrary();
    const playable = all.filter((piece) => piece.isPlayableNow);
    expect(all).toHaveLength(58);
    expect(playable).toHaveLength(58);
  });

  it('expose directement la liste jouable', () => {
    const playable = getPlayableMusicLibrary();
    expect(playable).toHaveLength(58);
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
