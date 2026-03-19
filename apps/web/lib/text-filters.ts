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
  return normalizeWhitespace(text.replace(/[\p{P}\p{S}]/gu, ' '));
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
