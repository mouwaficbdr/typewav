/**
 * selection-diversity.test.ts : caractérise la diversité réelle de la
 * sélection de texte de la config bar (audit QA 2026-09-04,
 * docs/qa/configbar-audit.md volet C).
 *
 * Mise à jour après l'extension des collections (feat/configbar-rework-p1,
 * décision 6 de l'audit) : les corpus sont passés de 427 à ~590 entrées, avec
 * priorité aux textes longs. Les seuils ci-dessous suivent cet état amélioré ;
 * la logique testée (relâchement, anti-répétition à un seul id exclu) est,
 * elle, inchangée et reste le vrai objet de ces tests.
 */

import { describe, expect, it } from 'vitest';
import type { TextEntry } from '@typewav/types';
import { ALL_COLLECTIONS } from '../index';
import { fetchPool, selectFromTexts } from '../fetch';
import { litteratureCollection } from '../litterature/collection.config';
import { gamingCollection } from '../gaming/collection.config';

describe('volet C : pools "Mots" par palier', () => {
  it('chaque collection a au moins 15 textes de 50 mots ou plus', () => {
    // Avant l'extension : 8 à 25 selon la collection, et souvent moins de 6
    // par langue une fois le filtre appliqué. Le mode Mots 50 avait alors un
    // pool trop petit pour que l'anti-répétition (un seul id exclu) évite les
    // redites. Seuil rehaussé après décision 6.
    for (const id of ALL_COLLECTIONS) {
      const pool = fetchPool(id, { wordCount: 50 });
      expect(pool.length).toBeGreaterThanOrEqual(15);
    }
  });

  it('le pool "Mots 100" reste étroit : peu de textes dépassent 100 mots', () => {
    // Toujours un point faible : les extraits du domaine public de bonne
    // qualité dépassent rarement 100 mots. Le mode Mots 100 reste donc le
    // palier le plus exposé aux répétitions.
    for (const id of ALL_COLLECTIONS) {
      const pool = fetchPool(id, { wordCount: 100 });
      expect(pool.length).toBeLessThanOrEqual(12);
    }
  });

  it('filtrer par langue réduit le pool "Mots 50"', () => {
    const both = fetchPool('litterature', { wordCount: 50 }).length;
    const fr = fetchPool('litterature', { wordCount: 50, language: 'fr' }).length;
    expect(fr).toBeLessThan(both);
    expect(fr).toBeGreaterThanOrEqual(8);
  });
});

describe('volet C : fenêtre "Temps" vide', () => {
  it('Gaming n\'a aucun texte dans la fenêtre 15 s (charCount 32 à 74)', () => {
    // 15 * 3.5 = 52.5 chars cible, bande [31.5, 73.5]. Le texte gaming le plus
    // court fait 82 chars. Le libellé "15 s" ne décrit alors plus rien
    // (relâchement total dans selectFromTexts).
    expect(fetchPool('gaming', { durationSeconds: 15 })).toEqual([]);
  });

  it('selectFromTexts renvoie quand même un texte (relâchement, jamais null)', () => {
    const t = selectFromTexts(gamingCollection.texts, { durationSeconds: 15 });
    expect(t).not.toBeNull();
  });
});

describe('volet C : anti-répétition figée avec un seul id exclu', () => {
  const A: TextEntry = {
    id: 'a',
    content: 'alpha '.repeat(120).trim(),
    source: 'x',
    language: 'fr',
    difficulty: 1,
    wordCount: 120,
    charCount: 600,
  };
  const B: TextEntry = { ...A, id: 'b', content: 'bravo '.repeat(120).trim() };

  it('un pool de 2 textes alterne strictement A B A B avec excludeIds du dernier', () => {
    const pool = [A, B];
    const seq: string[] = [];
    let last: string | undefined;
    for (let i = 0; i < 8; i++) {
      const picked = selectFromTexts(pool, {
        wordCount: 100,
        ...(last ? { excludeIds: [last] } : {}),
      });
      seq.push(picked!.id);
      last = picked!.id;
    }
    // À partir du 2e tir, chaque texte est différent du précédent, et comme le
    // pool ne fait que 2, la séquence est une alternance stricte.
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).not.toBe(seq[i - 1]);
    }
    expect(new Set(seq).size).toBe(2);
  });

  it('un pool ciblé de taille 1 renvoie toujours le même texte', () => {
    const pool = [A];
    for (let i = 0; i < 5; i++) {
      const picked = selectFromTexts(pool, {
        wordCount: 100,
        excludeIds: ['a'],
      });
      expect(picked!.id).toBe('a');
    }
  });
});

describe('volet C : le spread de difficulté existe mais n\'est pas consommé', () => {
  it('les collections portent bien une difficulté 1 à 5', () => {
    // HomeClient ne passe jamais difficulty / difficultyMin à selectFromTexts :
    // cette donnée est présente mais inutilisée par la sélection principale.
    const diffs = new Set(litteratureCollection.texts.map((t) => t.difficulty));
    expect([...diffs].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
