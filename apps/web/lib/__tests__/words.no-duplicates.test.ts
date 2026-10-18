/**
 * words.no-duplicates.test.ts : hygiène des pools de mots.
 *
 * Ces pools alimentent generateWordList (mode classique). Un doublon dans un
 * pool double la probabilité de tirer ce mot dans pickRandomWords : jamais
 * voulu.
 */

import { WORDS_EASY, WORDS_NORMAL, WORDS_HARD, WORDS_EXPERT } from '@/lib/words';
import { describe, expect, it } from 'vitest';

const POOLS: Record<string, string[]> = {
  WORDS_EASY,
  WORDS_NORMAL,
  WORDS_HARD,
  WORDS_EXPERT,
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
