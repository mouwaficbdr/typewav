import { describe, expect, it } from 'vitest';

import {
  getPitchPositionFromMidi,
  mapNoteToBarHeight,
  mapNoteToBarIndex,
  mapPitchToBarHeight,
  mapPitchToBarIndex,
  noteNameToMidi,
} from '../note-visualization';

describe('note-visualization', () => {
  it('convertit des notes en valeurs MIDI', () => {
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('A4')).toBe(69);
    expect(noteNameToMidi('Bb3')).toBe(58);
  });

  it('retourne null pour un nom de note invalide', () => {
    expect(noteNameToMidi('invalid')).toBeNull();
  });

  it('mappe un pitch MIDI vers une barre', () => {
    const index = mapPitchToBarIndex(66, 12);
    expect(index).not.toBeNull();
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(12);
  });

  it('mappe une note vers une barre via conversion MIDI', () => {
    const index = mapNoteToBarIndex('F#4', 12);
    expect(index).toBe(mapPitchToBarIndex(66, 12));
  });

  it('retombe sur la hauteur minimale pour un pitch invalide', () => {
    expect(mapPitchToBarHeight(Number.NaN, 4, 24)).toBe(4);
  });

  it('retombe sur la hauteur minimale pour les notes invalides', () => {
    expect(mapNoteToBarHeight('invalid', 4, 24)).toBe(4);
  });

  it('normalise un pitch sur le range piano standard', () => {
    expect(getPitchPositionFromMidi(21)).toBe(0);
    expect(getPitchPositionFromMidi(108)).toBe(1);
  });
});
