import { describe, expect, it } from 'vitest';
import { MUSIC_LIBRARY, MUSIC_LIBRARY_MAP } from '../library';

describe('MUSIC_LIBRARY', () => {
  it('contient exactement 58 pièces', () => {
    expect(MUSIC_LIBRARY).toHaveLength(58);
  });

  it('tous les IDs sont uniques', () => {
    const ids = MUSIC_LIBRARY.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tous les catalogNumbers sont uniques et entre 1 et 58', () => {
    const numbers = MUSIC_LIBRARY.map((p) => p.catalogNumber);
    expect(new Set(numbers).size).toBe(58);
    numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(58);
    });
  });

  it('tous les registres sont valides', () => {
    const validRegisters = [
      'energique',
      'contemplatif',
      'dramatique',
      'romantique',
      'folk',
    ];
    MUSIC_LIBRARY.forEach((p) => {
      expect(validRegisters).toContain(p.register);
    });
  });

  it('chaque pièce a au moins 16 notes', () => {
    MUSIC_LIBRARY.forEach((p) => {
      expect(p.notes.length).toBeGreaterThanOrEqual(16);
    });
  });

  it('les 8 pièces existantes sont toujours présentes', () => {
    const existing = [
      'fur-elise',
      'bwv846',
      'gymnopedie1',
      'korobeiniki',
      'ode-to-joy',
      'nocturne-op9-2',
      'rondo-alla-turca',
      'canon-in-d',
    ];
    existing.forEach((id) => {
      expect(MUSIC_LIBRARY_MAP.has(id)).toBe(true);
    });
  });

  it('MUSIC_LIBRARY_MAP contient toutes les pièces', () => {
    expect(MUSIC_LIBRARY_MAP.size).toBe(58);
  });
});
