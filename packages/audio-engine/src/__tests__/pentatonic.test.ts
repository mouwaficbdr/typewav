import { describe, expect, it } from 'vitest';
import {
  getChordPentatonicNotes,
  getPentatonicNote,
  isPentatonicNote,
  PENTATONIC_NOTES,
} from '../pentatonic';

describe('getPentatonicNote', () => {
  it("retourne une note pour chaque lettre minuscule de l'alphabet", () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (const char of alphabet) {
      const note = getPentatonicNote(char);
      expect(note).toMatch(/^[CDEGA][345]$/);
    }
  });

  it('est insensible à la casse : majuscule = minuscule', () => {
    expect(getPentatonicNote('A')).toBe(getPentatonicNote('a'));
    expect(getPentatonicNote('Z')).toBe(getPentatonicNote('z'));
  });

  it('retourne C4 par défaut pour un caractère non alphabétique', () => {
    expect(getPentatonicNote('!')).toBe('C4');
    expect(getPentatonicNote(' ')).toBe('C4');
    expect(getPentatonicNote('1')).toBe('C4');
  });

  it('toutes les notes retournées appartiennent à la gamme pentatonique', () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (const char of alphabet) {
      const note = getPentatonicNote(char);
      // La hauteur (sans octave) doit être dans C D E G A
      const pitch = note.replace(/\d/, '');
      expect(PENTATONIC_NOTES).toContain(pitch);
    }
  });

  it('respecte le mapping exact de la spec pour les lettres clés', () => {
    // Valeurs définies explicitement dans docs/specs/01-audio-engine.md
    expect(getPentatonicNote('a')).toBe('C4');
    expect(getPentatonicNote('e')).toBe('A4');
    expect(getPentatonicNote('f')).toBe('C5');
    expect(getPentatonicNote('k')).toBe('C3');
    expect(getPentatonicNote('z')).toBe('C3');
  });
});

describe('isPentatonicNote', () => {
  it('retourne true pour toutes les notes du mapping', () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (const char of alphabet) {
      const note = getPentatonicNote(char);
      expect(isPentatonicNote(note)).toBe(true);
    }
  });
});

describe('getChordPentatonicNotes', () => {
  it("filtre les notes non pentatoniques d'un accord", () => {
    // G major : G B D, B et D ne sont pas dans la gamme pentatonique... attends,
    // D est dans la gamme pentatonique : C D E G A
    // B n'y est pas
    const chordNotes = ['G4', 'B4', 'D5'];
    const result = getChordPentatonicNotes(chordNotes);
    expect(result).toContain('G4');
    expect(result).toContain('D5');
    expect(result).not.toContain('B4');
  });

  it("retourne un tableau vide si aucune note n'est pentatonique", () => {
    const chordNotes = ['B3', 'F4'];
    const result = getChordPentatonicNotes(chordNotes);
    expect(result).toHaveLength(0);
  });

  it('retourne toutes les notes si toutes sont pentatoniques', () => {
    const chordNotes = ['C4', 'E4', 'G4', 'A4'];
    const result = getChordPentatonicNotes(chordNotes);
    expect(result).toHaveLength(4);
  });
});
