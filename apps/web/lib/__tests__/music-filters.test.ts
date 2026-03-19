import type { UnifiedMusicPiece } from '@typewav/audio-engine';
import { describe, expect, it } from 'vitest';
import { filterMusicPieces } from '../music-filters';

const pieces: UnifiedMusicPiece[] = [
  {
    id: 'fur-elise',
    title: 'Für Elise',
    shortTitle: 'Fur Elise',
    composer: 'L. v. Beethoven',
    register: 'romantique',
    notes: ['E5'],
    catalogNumber: 1,
    midiPieceId: 'fur-elise',
    isPlayableNow: true,
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    shortTitle: 'Ode',
    composer: 'L. v. Beethoven',
    register: 'energique',
    notes: ['E4'],
    catalogNumber: 2,
    midiPieceId: 'ode-to-joy',
    isPlayableNow: true,
  },
  {
    id: 'clair-de-lune',
    title: 'Clair de Lune',
    shortTitle: 'Clair',
    composer: 'C. Debussy',
    register: 'contemplatif',
    notes: ['C5'],
    catalogNumber: 3,
    midiPieceId: null,
    isPlayableNow: false,
  },
];

describe('filterMusicPieces', () => {
  it('retourne toutes les pieces sans filtre', () => {
    const result = filterMusicPieces(pieces, {
      query: '',
      register: 'all',
      composer: 'all',
    });

    expect(result).toHaveLength(3);
  });

  it('filtre par registre', () => {
    const result = filterMusicPieces(pieces, {
      query: '',
      register: 'energique',
      composer: 'all',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('ode-to-joy');
  });

  it('filtre par compositeur', () => {
    const result = filterMusicPieces(pieces, {
      query: '',
      register: 'all',
      composer: 'C. Debussy',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('clair-de-lune');
  });

  it('filtre par recherche texte sans tenir compte des accents', () => {
    const result = filterMusicPieces(pieces, {
      query: 'fur',
      register: 'all',
      composer: 'all',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('fur-elise');
  });

  it('combine recherche + registre + compositeur', () => {
    const result = filterMusicPieces(pieces, {
      query: 'ode',
      register: 'energique',
      composer: 'L. v. Beethoven',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('ode-to-joy');
  });

  it('priorise les résultats les plus pertinents en recherche texte', () => {
    const result = filterMusicPieces(pieces, {
      query: 'clair',
      register: 'all',
      composer: 'all',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('clair-de-lune');
  });
});
