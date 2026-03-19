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

  return pieces.filter((piece) => {
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

    const normalizedNeedle = normalizedQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const matchesQuery = haystack.includes(normalizedNeedle);

    return matchesRegister && matchesComposer && matchesQuery;
  });
}
