import { describe, expect, it } from 'vitest';
import { MUSIC_LIBRARY } from '../library';
import { loadPiece, MIDI_PIECES } from '../midi-player';
import { getLibraryIdFromMidiPieceId } from '../music-catalog';

const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function noteNameToMidi(noteName: string): number | null {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(noteName.trim());
  if (!match) return null;

  const pitchClass = match[1]?.toUpperCase() ?? '';
  const accidental = match[2] ?? '';
  const octave = Number(match[3]);
  if (!Number.isFinite(octave)) return null;

  const baseOffset = NOTE_OFFSETS[pitchClass];
  if (baseOffset === undefined) return null;

  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (octave + 1) * 12 + baseOffset + accidentalOffset;
}

describe('melody integrity guardrails', () => {
  it('garantit que chaque entrée MIDI rejoue les hauteurs non-rest de la librairie', () => {
    for (const source of MUSIC_LIBRARY) {
      const loaded = loadPiece(source.id);
      const expectedPitches = source.notes
        .filter((note): note is string => note !== 'rest')
        .map((note) => noteNameToMidi(note))
        .filter((pitch): pitch is number => pitch !== null);

      expect(loaded.id).toBe(source.id);
      expect(loaded.notes.map((note) => note.pitch)).toEqual(expectedPitches);
    }
  });

  it('garantit que les alias legacy pointent vers la même mélodie canonique', () => {
    const aliases = ['gymnopedie-1', 'canon-pachelbel'] as const;

    for (const alias of aliases) {
      const canonicalId = getLibraryIdFromMidiPieceId(alias);
      const fromAlias = loadPiece(alias);
      const fromCanonical = loadPiece(canonicalId);

      expect(fromAlias.notes).toEqual(fromCanonical.notes);
      expect(fromAlias.bpmReference).toEqual(fromCanonical.bpmReference);
      expect(fromAlias.ppq).toEqual(fromCanonical.ppq);
    }
  });

  it('valide la cohérence globale du catalogue: 24 pièces, notes non vides, timing valide', () => {
    expect(Object.keys(MIDI_PIECES)).toHaveLength(24);

    for (const piece of Object.values(MIDI_PIECES)) {
      expect(piece.notes.length).toBeGreaterThan(0);
      expect(piece.bpmReference).toBeGreaterThan(0);
      expect(piece.ppq).toBeGreaterThan(0);
      expect(piece.totalDurationSec).toBeGreaterThan(0);

      for (const note of piece.notes) {
        expect(note.durationSec).toBeGreaterThan(0);
        expect(note.durationTicks).toBeGreaterThan(0);
      }
    }
  });
});
