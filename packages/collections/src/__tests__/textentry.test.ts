/**
 * textentry.test.ts : validation de la structure des TextEntry.
 * Spec : docs/specs/34-collections-refonte.md (Tests requis)
 */

import { describe, expect, it } from 'vitest';
import { litteratureCollection } from '../litterature/collection.config';
import { poesieCollection } from '../poesie/collection.config';
import { philosophieCollection } from '../philosophie/collection.config';
import { gamingCollection } from '../gaming/collection.config';
import { codeCollection } from '../code/collection.config';

const allCollections = [
  litteratureCollection,
  poesieCollection,
  philosophieCollection,
  gamingCollection,
  codeCollection,
];

describe('TextEntry : wordCount et charCount', () => {
  it('wordCount est cohérent avec le contenu', () => {
    const entry = litteratureCollection.texts[0]!;
    const expected = entry.content.split(/\s+/).filter(Boolean).length;
    expect(entry.wordCount).toBe(expected);
  });

  it('charCount est cohérent avec le contenu', () => {
    const entry = litteratureCollection.texts[0]!;
    expect(entry.charCount).toBe(entry.content.length);
  });

  it('difficulty est entre 1 et 5', () => {
    litteratureCollection.texts.forEach((t) => {
      expect(t.difficulty).toBeGreaterThanOrEqual(1);
      expect(t.difficulty).toBeLessThanOrEqual(5);
    });
  });

  it('tous les textes ont un id unique dans chaque collection', () => {
    for (const col of allCollections) {
      const ids = col.texts.map((t) => t.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  });

  it('tous les textes ont un contenu non vide', () => {
    for (const col of allCollections) {
      col.texts.forEach((t) => {
        expect(t.content.length).toBeGreaterThan(0);
      });
    }
  });

  it('tous les wordCount et charCount correspondent au contenu réel', () => {
    for (const col of allCollections) {
      col.texts.forEach((t) => {
        const expectedWc = t.content.split(/\s+/).filter(Boolean).length;
        const expectedCc = t.content.length;
        expect(t.wordCount).toBe(expectedWc);
        expect(t.charCount).toBe(expectedCc);
      });
    }
  });

  it('litterature a au moins 50 textes FR et 50 textes EN', () => {
    const fr = litteratureCollection.texts.filter((t) => t.language === 'fr');
    const en = litteratureCollection.texts.filter((t) => t.language === 'en');
    expect(fr.length).toBeGreaterThanOrEqual(50);
    expect(en.length).toBeGreaterThanOrEqual(50);
  });

  it('poesie a au moins 30 textes FR et 30 textes EN', () => {
    const fr = poesieCollection.texts.filter((t) => t.language === 'fr');
    const en = poesieCollection.texts.filter((t) => t.language === 'en');
    expect(fr.length).toBeGreaterThanOrEqual(30);
    expect(en.length).toBeGreaterThanOrEqual(30);
  });

  it('philosophie a au moins 30 textes FR et 30 textes EN', () => {
    const fr = philosophieCollection.texts.filter((t) => t.language === 'fr');
    const en = philosophieCollection.texts.filter((t) => t.language === 'en');
    expect(fr.length).toBeGreaterThanOrEqual(30);
    expect(en.length).toBeGreaterThanOrEqual(30);
  });

  it('gaming a au moins 30 textes FR et 30 textes EN', () => {
    const fr = gamingCollection.texts.filter((t) => t.language === 'fr');
    const en = gamingCollection.texts.filter((t) => t.language === 'en');
    expect(fr.length).toBeGreaterThanOrEqual(30);
    expect(en.length).toBeGreaterThanOrEqual(30);
  });

  it('code a au moins 20 textes FR et 50 textes EN', () => {
    const fr = codeCollection.texts.filter((t) => t.language === 'fr');
    const en = codeCollection.texts.filter((t) => t.language === 'en');
    expect(fr.length).toBeGreaterThanOrEqual(20);
    expect(en.length).toBeGreaterThanOrEqual(50);
  });
});
