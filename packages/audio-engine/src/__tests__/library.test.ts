import { describe, expect, it } from 'vitest';
import { MUSIC_LIBRARY, MUSIC_LIBRARY_MAP } from '../library';

describe('MUSIC_LIBRARY', () => {
  it('contient exactement 24 pièces', () => {
    expect(MUSIC_LIBRARY).toHaveLength(24);
  });

  it('tous les IDs sont uniques', () => {
    const ids = MUSIC_LIBRARY.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tous les catalogNumbers sont uniques et entre 1 et 24', () => {
    const numbers = MUSIC_LIBRARY.map((p) => p.catalogNumber);
    expect(new Set(numbers).size).toBe(24);
    numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(24);
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

  it('les pièces importées conservées sont présentes', () => {
    const existing = [
      'fur-elise',
      'gymnopedie1',
      'ode-to-joy',
      'rondo-alla-turca',
      'canon-in-d',
      'toccata-fugue',
      'mountain-king',
      'symphony-5-theme',
      'ave-maria',
    ];
    existing.forEach((id) => {
      expect(MUSIC_LIBRARY_MAP.has(id)).toBe(true);
    });
  });

  it('MUSIC_LIBRARY_MAP contient toutes les pièces', () => {
    expect(MUSIC_LIBRARY_MAP.size).toBe(24);
  });
});
