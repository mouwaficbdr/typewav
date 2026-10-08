import { describe, expect, it } from 'vitest';
import { CADENCE, pitchForCode } from '../conservatoire/instrument';
import {
  HOME_SCALE,
  PHYSICAL_KEYS,
  codeForAzertyChar,
  keyByCode,
} from '../conservatoire/physical-keys';

describe('table physique des touches', () => {
  it('décrit 50 touches, chacune une seule fois', () => {
    expect(PHYSICAL_KEYS).toHaveLength(50);
    expect(new Set(PHYSICAL_KEYS.map((k) => k.code)).size).toBe(50);
  });

  it('le doigt dépend de la position physique', () => {
    expect(keyByCode('KeyF')?.finger).toBe('LI');
    expect(keyByCode('KeyG')?.finger).toBe('LI');
    expect(keyByCode('KeyH')?.finger).toBe('RI');
    expect(keyByCode('KeyJ')?.finger).toBe('RI');
    expect(keyByCode('Semicolon')?.finger).toBe('RP');
    expect(keyByCode('Space')?.finger).toBe('RT');
  });

  it('les libellés viennent de la disposition', () => {
    expect(keyByCode('KeyQ')?.labels).toEqual({ azerty: 'a', qwerty: 'q' });
    expect(keyByCode('KeyA')?.labels).toEqual({ azerty: 'q', qwerty: 'a' });
    expect(keyByCode('Semicolon')?.labels).toEqual({ azerty: 'm', qwerty: ';' });
    expect(keyByCode('KeyM')?.labels).toEqual({ azerty: ',', qwerty: 'm' });
  });

  it('seules F et J portent une bosse', () => {
    expect(PHYSICAL_KEYS.filter((k) => k.bump).map((k) => k.code)).toEqual([
      'KeyF',
      'KeyJ',
    ]);
  });

  it("retrouve la position d'un caractère AZERTY", () => {
    expect(codeForAzertyChar('q')).toBe('KeyA');
    expect(codeForAzertyChar('m')).toBe('Semicolon');
    expect(codeForAzertyChar('é')).toBe('Digit2');
    expect(codeForAzertyChar(' ')).toBeUndefined();
    expect(codeForAzertyChar('Maj')).toBeUndefined();
  });
});

describe("instrument : une note par doigt, l'octave par rangée (D6)", () => {
  it('la rangée du milieu joue do ré mi fa sol la si do sous les huit doigts', () => {
    expect(HOME_SCALE.map(pitchForCode)).toEqual([
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
    ]);
  });

  it("les deux touches d'un même doigt sur une rangée sonnent pareil", () => {
    expect(pitchForCode('KeyG')).toBe('F4');
    expect(pitchForCode('KeyH')).toBe('G4');
  });

  it('haut 5, bas 3, chiffres 6', () => {
    expect(pitchForCode('KeyQ')).toBe('C5');
    expect(pitchForCode('KeyZ')).toBe('C3');
    expect(pitchForCode('Digit1')).toBe('C6');
    expect(pitchForCode('Equal')).toBe('C7');
  });

  it('Espace et Maj ne jouent rien, un code inconnu non plus', () => {
    expect(pitchForCode('Space')).toBeNull();
    expect(pitchForCode('ShiftLeft')).toBeNull();
    expect(pitchForCode('ShiftRight')).toBeNull();
    expect(pitchForCode('F13')).toBeNull();
  });

  it('la cadence se résout sur la tonique', () => {
    expect(CADENCE.map(([note]) => note)).toEqual(['E4', 'G4', 'C5']);
  });
});
