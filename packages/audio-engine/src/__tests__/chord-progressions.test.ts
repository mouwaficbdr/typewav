import { describe, expect, it } from 'vitest';
import {
  getAvailableThemes,
  getChordAtIndex,
  getChordProgression,
  type ChordProgressionTheme,
} from '../chord-progressions';

describe('getChordProgression', () => {
  it('retourne une progression valide pour chaque thème disponible', () => {
    const themes = getAvailableThemes();
    for (const theme of themes) {
      const progression = getChordProgression(theme);
      expect(progression.themeId).toBe(theme);
      expect(progression.chords).toHaveLength(4);
    }
  });

  it('chaque accord a un symbole et au moins 2 notes', () => {
    const themes = getAvailableThemes();
    for (const theme of themes) {
      const { chords } = getChordProgression(theme);
      for (const chord of chords) {
        expect(chord.symbol).toBeTruthy();
        expect(chord.notes.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('retourne la progression terminale correcte (mineure sombre)', () => {
    const progression = getChordProgression('terminal');
    expect(progression.chords[0]!.symbol).toBe('Am');
    expect(progression.chords[1]!.symbol).toBe('G');
    expect(progression.chords[2]!.symbol).toBe('F');
    expect(progression.chords[3]!.symbol).toBe('Em');
  });

  it('retourne la progression noir correcte (jazz)', () => {
    const progression = getChordProgression('noir');
    expect(progression.chords[0]!.symbol).toBe('Dm7');
    expect(progression.chords[3]!.symbol).toBe('Am7');
  });

  it('retourne la progression arcade correcte (pop)', () => {
    const progression = getChordProgression('arcade');
    expect(progression.chords[0]!.symbol).toBe('C');
    expect(progression.chords[2]!.symbol).toBe('Am');
  });
});

describe('getChordAtIndex', () => {
  it('retourne le premier accord pour wordIndex = 0', () => {
    const chord = getChordAtIndex('arcade', 0);
    expect(chord.symbol).toBe('C');
  });

  it('cycle correctement au-delà de 4 accords', () => {
    // La progression a 4 accords : index 4 doit revenir à l'accord 0
    const chord0 = getChordAtIndex('arcade', 0);
    const chord4 = getChordAtIndex('arcade', 4);
    expect(chord0.symbol).toBe(chord4.symbol);
  });

  it('fonctionne avec des wordIndex élevés', () => {
    const themes: ChordProgressionTheme[] = getAvailableThemes();
    for (const theme of themes) {
      const chord = getChordAtIndex(theme, 1337);
      expect(chord.symbol).toBeTruthy();
      expect(chord.notes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("avance d'un accord par mot", () => {
    const chords = [0, 1, 2, 3].map((i) => getChordAtIndex('terminal', i));
    const symbols = chords.map((c) => c.symbol);
    expect(symbols).toEqual(['Am', 'G', 'F', 'Em']);
  });
});

describe('getAvailableThemes', () => {
  it('retourne les 4 thèmes officiels de la Phase 0', () => {
    const themes = getAvailableThemes();
    expect(themes).toContain('terminal');
    expect(themes).toContain('noir');
    expect(themes).toContain('midnight-sun');
    expect(themes).toContain('arcade');
    expect(themes).toHaveLength(4);
  });
});
