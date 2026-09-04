export interface TextFilterOptions {
  punctuationEnabled: boolean;
  numbersEnabled: boolean;
  mode: string;
  wordCount: number;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function removePunctuation(text: string): string {
  // Retire la ponctuation de phrase (points, virgules, guillemets, tirets
  // cadratins, parenthèses...) mais garde ce qui vit A L'INTERIEUR d'un mot :
  // - les apostrophes des contractions ("l'histoire", "n'est", "don't"),
  // - le trait d'union simple entre deux lettres ("peut-etre", "well-known").
  // Sans ça, une citation devient "L histoire n est que" : des fragments
  // abîmés plutôt qu'un texte sans ponctuation.
  return normalizeWhitespace(
    text.replace(/[\p{P}\p{S}]/gu, (ch, offset: number, str: string) => {
      if (ch === "'" || ch === '’') return ch;
      if (
        ch === '-' &&
        /\p{L}/u.test(str[offset - 1] ?? '') &&
        /\p{L}/u.test(str[offset + 1] ?? '')
      ) {
        return ch;
      }
      return ' ';
    }),
  );
}

export function removeNumbers(text: string): string {
  return normalizeWhitespace(text.replace(/[\p{N}]/gu, ' '));
}

export function truncateToWords(text: string, count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '';

  const words = normalizeWhitespace(text).split(' ');
  return words.slice(0, count).join(' ');
}

export function applyTextFilters(
  text: string,
  options: TextFilterOptions,
): string {
  let nextText = normalizeWhitespace(text);

  if (!options.punctuationEnabled) {
    nextText = removePunctuation(nextText);
  }

  if (!options.numbersEnabled) {
    nextText = removeNumbers(nextText);
  }

  if (options.mode === 'sprint') {
    nextText = truncateToWords(nextText, options.wordCount);
  }

  return normalizeWhitespace(nextText);
}
