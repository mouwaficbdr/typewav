import { describe, expect, it } from 'vitest';
import {
  HOME_ROW_CODES,
  HOME_ROW_NOTES,
  homeRowLabel,
} from '../home-row';

describe('home-row', () => {
  it('do4 à do5, main gauche puis main droite', () => {
    expect(HOME_ROW_NOTES).toEqual({
      KeyA: 'C4',
      KeyS: 'D4',
      KeyD: 'E4',
      KeyF: 'F4',
      KeyJ: 'G4',
      KeyK: 'A4',
      KeyL: 'B4',
      Semicolon: 'C5',
    });
  });

  it('libellés AZERTY', () => {
    expect(HOME_ROW_CODES.map((c) => homeRowLabel(c, 'azerty')).join(' ')).toBe(
      'q s d f j k l m',
    );
  });

  it('libellés QWERTY', () => {
    expect(HOME_ROW_CODES.map((c) => homeRowLabel(c, 'qwerty')).join(' ')).toBe(
      'a s d f j k l ;',
    );
  });
});
