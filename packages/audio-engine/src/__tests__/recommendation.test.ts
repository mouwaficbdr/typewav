import { describe, expect, it } from 'vitest';
import { MUSIC_LIBRARY } from '../library';
import {
  getRecommendedPiece,
  getRecommendedRegister,
  pickPiece,
} from '../recommendation';

describe('getRecommendedRegister', () => {
  it('mode sprint → energique', () => {
    expect(getRecommendedRegister('sprint', undefined, 60)).toBe('energique');
  });

  it('mode learning → contemplatif', () => {
    expect(getRecommendedRegister('learning', undefined, 60)).toBe(
      'contemplatif',
    );
  });

  it('mode ghost → energique', () => {
    expect(getRecommendedRegister('ghost', undefined, 60)).toBe('energique');
  });

  it('mode code → dramatique', () => {
    expect(getRecommendedRegister('code', undefined, 60)).toBe('dramatique');
  });

  it('mode classic + collection poesie → romantique', () => {
    expect(getRecommendedRegister('classic', 'poesie', 60)).toBe('romantique');
  });

  it('mode classic + collection philosophie → dramatique', () => {
    expect(getRecommendedRegister('classic', 'philosophie', 60)).toBe(
      'dramatique',
    );
  });

  it('durée 15s → energique (si aucune règle mode/collection)', () => {
    expect(getRecommendedRegister('classic', 'litterature', 15)).toBe(
      'energique',
    );
  });

  it('durée 120s → contemplatif (si aucune règle mode/collection)', () => {
    expect(getRecommendedRegister('classic', 'litterature', 120)).toBe(
      'contemplatif',
    );
  });

  it('fallback → romantique', () => {
    expect(getRecommendedRegister('classic', undefined, 60)).toBe('romantique');
  });
});

describe('pickPiece', () => {
  it('retourne une pièce du registre demandé', () => {
    const piece = pickPiece('energique');
    expect(piece?.register).toBe('energique');
  });

  it("n'inclut pas les IDs exclus quand le pool le permet", () => {
    const all = MUSIC_LIBRARY.filter((p) => p.register === 'folk').map(
      (p) => p.id,
    );
    // Exclure tous sauf un
    const excluded = all.slice(0, -1);
    const piece = pickPiece('folk', excluded);
    expect(piece).not.toBeNull();
    expect(excluded).not.toContain(piece!.id);
  });

  it('retourne quand même une pièce si tous les IDs sont exclus (pas de deadlock)', () => {
    // Avec pool forcément épuisé → retourne quand même une pièce
    const allIds = MUSIC_LIBRARY.map((p) => p.id);
    const piece = pickPiece('energique', allIds);
    expect(piece).not.toBeNull();
  });

  it('exclut les pièces à tempo évolutif si demandé', () => {
    const piece = pickPiece('energique', [], true);
    if (piece) expect(piece.evolutiveTempo).not.toBe(true);
  });
});

describe('getRecommendedPiece', () => {
  it('retourne une pièce non-null dans la majorité des cas', () => {
    const piece = getRecommendedPiece('sprint', undefined, 30);
    expect(piece).not.toBeNull();
    expect(piece?.register).toBe('energique');
  });
});
