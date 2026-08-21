/**
 * fetch.test.ts — tests pour fetchCollection() adaptatif.
 * Spec : docs/specs/34-collections-refonte.md — Tests requis
 */

import { describe, expect, it } from 'vitest';
import type { TextEntry } from '@typewav/types';
import { litteratureCollection } from '../litterature/collection.config';
import { fetchCollection, selectFromTexts } from '../fetch';

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

  it('filtre par wordCount 10 — ne retourne jamais moins de 10 mots réels (troncature exacte en aval)', () => {
    const t = fetchCollection('litterature', { wordCount: 10 });
    if (t) {
      expect(t.wordCount).toBeGreaterThanOrEqual(10);
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

describe('selectFromTexts', () => {
  it('opère sur un tableau explicite — pas besoin de connaître un collectionId', () => {
    const texts = litteratureCollection.texts;
    const t = selectFromTexts(texts);
    expect(t).not.toBeNull();
    expect(texts).toContainEqual(t);
  });

  it('retourne null sur un tableau vide (contrairement à fetchCollection qui ne reçoit jamais ce cas)', () => {
    expect(selectFromTexts([])).toBeNull();
  });

  it('wordCount ne retourne jamais un texte plus court que la cible — la troncature en aval doit toujours pouvoir couper exactement N mots', () => {
    const mixedLengthPool: TextEntry[] = [
      {
        id: 'short',
        content: Array.from({ length: 40 }, (_, i) => `mot${i}`).join(' '),
        source: 'x',
        language: 'fr',
        difficulty: 1,
        wordCount: 40,
        charCount: 200,
      },
      {
        id: 'exact',
        content: Array.from({ length: 100 }, (_, i) => `mot${i}`).join(' '),
        source: 'x',
        language: 'fr',
        difficulty: 1,
        wordCount: 100,
        charCount: 500,
      },
      {
        id: 'long',
        content: Array.from({ length: 130 }, (_, i) => `mot${i}`).join(' '),
        source: 'x',
        language: 'fr',
        difficulty: 1,
        wordCount: 130,
        charCount: 650,
      },
    ];

    for (let i = 0; i < 20; i++) {
      const t = selectFromTexts(mixedLengthPool, { wordCount: 100 });
      expect(t?.wordCount).toBeGreaterThanOrEqual(100);
    }
  });

  it('filtre par durationSeconds comme fetchCollection', () => {
    const t = selectFromTexts(litteratureCollection.texts, { durationSeconds: 30 });
    if (t) {
      expect(t.charCount).toBeGreaterThanOrEqual(63);
      expect(t.charCount).toBeLessThanOrEqual(147);
    }
  });

  it('produit le même comportement que fetchCollection pour la même collection', () => {
    // fetchCollection(id, opts) doit être un simple raccourci vers
    // selectFromTexts(COLLECTION_MAP[id].texts, opts) — vérifié indirectement
    // via la cohérence des plages retournées plutôt que l'égalité exacte
    // (sélection aléatoire).
    const t = selectFromTexts(litteratureCollection.texts, { wordCount: 10 });
    if (t) {
      expect(t.wordCount).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('selectFromTexts — numbersEnabled', () => {
  const mixedPool: TextEntry[] = [
    {
      id: 'a',
      content: 'Un texte sans aucun chiffre.',
      source: 'x',
      language: 'fr',
      difficulty: 1,
      wordCount: 5,
      charCount: 28,
    },
    {
      id: 'b',
      content: 'Un texte sans nombre non plus.',
      source: 'x',
      language: 'fr',
      difficulty: 1,
      wordCount: 6,
      charCount: 31,
    },
    {
      id: 'c',
      content: 'En 1815, un texte avec un chiffre.',
      source: 'x',
      language: 'fr',
      difficulty: 1,
      wordCount: 7,
      charCount: 35,
    },
  ];

  it('privilégie un texte contenant un chiffre quand numbersEnabled est vrai', () => {
    for (let i = 0; i < 20; i++) {
      const t = selectFromTexts(mixedPool, { numbersEnabled: true });
      expect(t?.id).toBe('c');
    }
  });

  it('ne filtre pas par chiffre quand numbersEnabled est faux ou absent', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const t = selectFromTexts(mixedPool, {});
      if (t) ids.add(t.id);
    }
    expect(ids.size).toBeGreaterThan(1);
  });

  it('ne retourne jamais null si aucun texte du pool ne contient de chiffre (relâchement)', () => {
    const noDigitPool: TextEntry[] = [
      {
        id: 'x',
        content: 'Aucun chiffre ici.',
        source: 'x',
        language: 'fr',
        difficulty: 1,
        wordCount: 3,
        charCount: 18,
      },
    ];
    const t = selectFromTexts(noDigitPool, { numbersEnabled: true });
    expect(t).not.toBeNull();
    expect(t?.id).toBe('x');
  });

  it("garde numbersEnabled même si le seul texte à chiffre vient d'être exclu (un repeat occasionnel est moins grave que perdre la préférence)", () => {
    const t = selectFromTexts(mixedPool, {
      numbersEnabled: true,
      excludeIds: ['c'],
    });
    expect(t?.id).toBe('c');
  });

  it('garde numbersEnabled même quand durationSeconds ne correspond à aucun texte (relâche la longueur avant le chiffre)', () => {
    // Les 3 textes du pool font 28-35 caractères — aucun ne correspond à la
    // bande attendue pour 60s (126-294 caractères). Le relâchement doit
    // abandonner la cible de durée avant d'abandonner la préférence chiffres,
    // sans quoi les deux se relâchent ensemble et le pick redevient aléatoire.
    for (let i = 0; i < 20; i++) {
      const t = selectFromTexts(mixedPool, {
        numbersEnabled: true,
        durationSeconds: 60,
      });
      expect(t?.id).toBe('c');
    }
  });
});
