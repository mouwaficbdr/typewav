import {
  applyTextFilters,
  removeNumbers,
  removePunctuation,
  truncateToWords,
} from '@/lib/text-filters';
import { describe, expect, it } from 'vitest';

describe('text-filters', () => {
  it('removePunctuation supprime la ponctuation et conserve les accents', () => {
    const input = 'Bonjour, cafe! Ca va? Oui: tres bien.';
    expect(removePunctuation(input)).toBe('Bonjour cafe Ca va Oui tres bien');
  });

  it('removeNumbers supprime les chiffres', () => {
    const input = 'Version 2.0 en 2026';
    expect(removeNumbers(input)).toBe('Version . en');
  });

  it('truncateToWords limite au nombre de mots demande', () => {
    const input = 'one two three four five';
    expect(truncateToWords(input, 3)).toBe('one two three');
  });

  it('applyTextFilters applique les modificateurs en mode classic', () => {
    const input = 'Hello, world! 2026';

    expect(
      applyTextFilters(input, {
        punctuationEnabled: false,
        numbersEnabled: false,
        mode: 'classic',
        wordCount: 25,
      }),
    ).toBe('Hello world');
  });

  it('applyTextFilters tronque en mode sprint', () => {
    const input = 'one two three four five six';

    expect(
      applyTextFilters(input, {
        punctuationEnabled: true,
        numbersEnabled: true,
        mode: 'sprint',
        wordCount: 4,
      }),
    ).toBe('one two three four');
  });
});
