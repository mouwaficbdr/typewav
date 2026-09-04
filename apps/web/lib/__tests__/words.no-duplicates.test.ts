/**
 * words.no-duplicates.test.ts : hygiène des pools de mots.
 *
 * Ces pools alimentent le mode Apprentissage via generateLearningText
 * (niveau 1 : WORDS_HOME_ROW filtré par touches ; niveaux 2 à 4 :
 * WORDS_EASY / WORDS_NORMAL). Un doublon dans un pool double la probabilité
 * de tirer ce mot dans pickRandomWords : jamais voulu.
 */

import {
  WORDS_EASY,
  WORDS_NORMAL,
  WORDS_HARD,
  WORDS_EXPERT,
  WORDS_HOME_ROW,
  generateLearningText,
} from '@/lib/words';
import { describe, expect, it } from 'vitest';

const POOLS: Record<string, string[]> = {
  WORDS_EASY,
  WORDS_NORMAL,
  WORDS_HARD,
  WORDS_EXPERT,
  WORDS_HOME_ROW,
};

describe('pools de mots : pas de doublon', () => {
  for (const [name, pool] of Object.entries(POOLS)) {
    it(`${name} n'a aucune entrée dupliquée`, () => {
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const w of pool) {
        if (seen.has(w)) dupes.push(w);
        seen.add(w);
      }
      expect(dupes).toEqual([]);
    });
  }
});

describe('generateLearningText : pools non vides après filtrage', () => {
  it('niveau 1 (home row) produit un texte non vide de mots home row', () => {
    const text = generateLearningText(1, 12);
    const words = text.split(' ').filter(Boolean);
    expect(words.length).toBe(12);
    // Toutes les lettres du niveau 1 : a s d f j k l ;
    const allowed = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l', ';']);
    for (const w of words) {
      for (const ch of w.toLowerCase()) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it('niveaux 2 à 5 produisent le nombre de mots demandé', () => {
    for (const level of [2, 3, 4, 5]) {
      const words = generateLearningText(level, 15).split(' ').filter(Boolean);
      expect(words.length).toBe(15);
    }
  });
});
