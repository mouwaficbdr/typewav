import { describe, expect, it } from 'vitest';

import {
  applyTypingExpression,
  getTypingOctaveShift,
  transposeNoteOctaves,
} from '../note-expression';

describe('note-expression', () => {
  it('retourne un shift d octave borne selon wordIndex pour consonnes', () => {
    expect(getTypingOctaveShift('t', 0)).toBe(-1);
    expect(getTypingOctaveShift('t', 1)).toBe(0);
    expect(getTypingOctaveShift('t', 2)).toBe(1);
    expect(getTypingOctaveShift('t', 3)).toBe(0);
  });

  it('n applique pas de shift pour les voyelles', () => {
    expect(getTypingOctaveShift('a', 0)).toBe(0);
    expect(getTypingOctaveShift('E', 2)).toBe(0);
  });

  it('transpose la note et preserve accidentelles', () => {
    expect(transposeNoteOctaves('F#4', 1)).toBe('F#5');
    expect(transposeNoteOctaves('Bb3', 1)).toBe('Bb4');
  });

  it('borne la transposition aux octaves autorisees', () => {
    expect(transposeNoteOctaves('C2', -1)).toBe('C2');
    expect(transposeNoteOctaves('C6', 1)).toBe('C6');
  });

  it('laisse la note intacte si format invalide', () => {
    expect(transposeNoteOctaves('invalid', 1)).toBe('invalid');
  });

  it('applique une expression complete depuis char et wordIndex', () => {
    expect(applyTypingExpression('G4', 't', 0)).toBe('G3');
    expect(applyTypingExpression('G4', 'a', 0)).toBe('G4');
  });
});
