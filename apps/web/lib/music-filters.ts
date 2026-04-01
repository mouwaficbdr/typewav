import type { UnifiedMusicPiece } from '@typewav/audio-engine';

export interface MusicFilterCriteria {
  query: string;
  register: string;
  composer: string;
}

export function filterMusicPieces(
  pieces: UnifiedMusicPiece[],
  criteria: MusicFilterCriteria,
): UnifiedMusicPiece[] {
  const normalizedQuery = criteria.query.trim().toLowerCase();

  const normalizedNeedle = normalizedQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const filtered = pieces.filter((piece) => {
    const matchesRegister =
      criteria.register === 'all' || piece.register === criteria.register;

    const matchesComposer =
      criteria.composer === 'all' || piece.composer === criteria.composer;

    if (!normalizedQuery) {
      return matchesRegister && matchesComposer;
    }

    const haystack = `${piece.title} ${piece.shortTitle} ${piece.composer}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const matchesQuery = haystack.includes(normalizedNeedle);

    return matchesRegister && matchesComposer && matchesQuery;
  });

  // Sans requête: ordre catalogue pour rester stable et lisible.
  if (!normalizedNeedle) {
    return [...filtered].sort((a, b) => a.catalogNumber - b.catalogNumber);
  }

  const scored = filtered.map((piece) => {
    const title = piece.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const shortTitle = piece.shortTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const composer = piece.composer
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    let score = 0;

    if (title === normalizedNeedle || shortTitle === normalizedNeedle)
      score += 140;
    if (title.startsWith(normalizedNeedle)) score += 90;
    if (shortTitle.startsWith(normalizedNeedle)) score += 80;
    if (title.includes(normalizedNeedle)) score += 50;
    if (shortTitle.includes(normalizedNeedle)) score += 40;
    if (composer.startsWith(normalizedNeedle)) score += 35;
    if (composer.includes(normalizedNeedle)) score += 20;

    return { piece, score };
  });

  return [...scored]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.piece.catalogNumber - b.piece.catalogNumber;
    })
    .map((item) => item.piece);
}
