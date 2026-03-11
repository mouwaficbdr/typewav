/**
 * fetch.test.ts — tests pour fetchCollection() adaptatif.
 * Spec : docs/specs/34-collections-refonte.md — Tests requis
 */

import { describe, expect, it } from 'vitest';
import { litteratureCollection } from '../litterature/collection.config';
import { fetchCollection } from '../fetch';

describe('fetchCollection', () => {
  it('retourne un texte de la collection sans options', () => {
    const t = fetchCollection('litterature');
    expect(t).not.toBeNull();
    expect(t!.content.length).toBeGreaterThan(0);
  });

  it('filtre par langue fr correctement', () => {
    const t = fetchCollection('litterature', { language: 'fr' });
    expect(t?.language).toBe('fr');
  });

  it('filtre par langue en correctement', () => {
    const t = fetchCollection('litterature', { language: 'en' });
    expect(t?.language).toBe('en');
  });

  it('filtre par wordCount 10 — textes courts retournés', () => {
    const t = fetchCollection('litterature', { wordCount: 10 });
    if (t) {
      expect(t.wordCount).toBeGreaterThanOrEqual(5);
      expect(t.wordCount).toBeLessThanOrEqual(15);
    }
  });

  it('filtre par difficulté', () => {
    const t = fetchCollection('litterature', { difficulty: 1 });
    if (t) expect(t.difficulty).toBe(1);
  });

  it('exclut les IDs récents si pool le permet', () => {
    const first = fetchCollection('litterature', { language: 'fr' });
    expect(first).not.toBeNull();

    const second = fetchCollection('litterature', {
      language: 'fr',
      excludeIds: [first!.id],
    });
    if (second) expect(second.id).not.toBe(first!.id);
  });

  it('ne retourne pas null si pool vide après exclusion (fallback)', () => {
    const all = litteratureCollection.texts
      .filter((t) => t.language === 'fr')
      .map((t) => t.id);
    const t = fetchCollection('litterature', {
      language: 'fr',
      excludeIds: all,
    });
    expect(t).not.toBeNull();
  });

  it('filtre par durationSeconds — textes de longueur appropriée', () => {
    // 30s * 3.5 chars/s = 105 chars, ±40% → 63–147 chars
    const t = fetchCollection('litterature', { durationSeconds: 30 });
    if (t) {
      expect(t.charCount).toBeGreaterThanOrEqual(63);
      expect(t.charCount).toBeLessThanOrEqual(147);
    }
  });

  it('filtre par difficultyMin — retourne seulement les difficultés ≥ min', () => {
    const t = fetchCollection('philosophie', { difficultyMin: 4 });
    if (t) expect(t.difficulty).toBeGreaterThanOrEqual(4);
  });

  it('fonctionne avec toutes les collections', () => {
    const collections = ['litterature', 'poesie', 'philosophie', 'gaming', 'code'] as const;
    for (const id of collections) {
      const t = fetchCollection(id);
      expect(t).not.toBeNull();
    }
  });
});
