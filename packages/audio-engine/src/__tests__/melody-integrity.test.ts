import { describe, expect, it } from 'vitest';
import { MUSIC_LIBRARY } from '../library';
import { loadPiece, MIDI_PIECES } from '../midi-player';
import { getLibraryIdFromMidiPieceId } from '../music-catalog';

const VALID_DURATIONS = new Set(['1n', '2n', '4n', '8n', '16n', '32n']);

describe('melody integrity guardrails', () => {
  it('garantit que chaque entrée MIDI rejoue exactement les notes de la librairie', () => {
    for (const source of MUSIC_LIBRARY) {
      const loaded = loadPiece(source.id);
      const expectedNotes = source.notes.filter(
        (note): note is string => typeof note === 'string',
      );

      expect(loaded.id).toBe(source.id);
      expect(loaded.notes).toEqual(expectedNotes);
    }
  });

  it('garantit que les alias legacy pointent vers la même mélodie canonique', () => {
    const aliases = ['gymnopedie-1', 'canon-pachelbel'] as const;

    for (const alias of aliases) {
      const canonicalId = getLibraryIdFromMidiPieceId(alias);
      const fromAlias = loadPiece(alias);
      const fromCanonical = loadPiece(canonicalId);

      expect(fromAlias.notes).toEqual(fromCanonical.notes);
      expect(fromAlias.noteDuration).toEqual(fromCanonical.noteDuration);
    }
  });

  it('valide la cohérence globale du catalogue: 24 pièces, notes non vides, durées valides', () => {
    expect(Object.keys(MIDI_PIECES)).toHaveLength(24);

    for (const piece of Object.values(MIDI_PIECES)) {
      expect(piece.notes.length).toBeGreaterThan(0);
      expect(VALID_DURATIONS.has(piece.noteDuration)).toBe(true);
    }
  });
});
