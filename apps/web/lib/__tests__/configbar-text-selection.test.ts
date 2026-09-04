/**
 * configbar-text-selection.test.ts : caractérise les filtres de texte de la
 * config bar (audit QA 2026-09-04, docs/qa/configbar-audit.md volets A/C).
 *
 * Comportement ACTUEL, pas souhaité : documente les écarts entre ce que les
 * chips promettent et ce que le pipeline produit.
 */

import { applyTextFilters } from '@/lib/text-filters';
import { describe, expect, it } from 'vitest';

describe('mode Mots (sprint) : troncature', () => {
  it('tronque exactement à N mots quand la source est plus longue', () => {
    const src = Array.from({ length: 40 }, (_, i) => `mot${i}`).join(' ');
    const out = applyTextFilters(src, {
      punctuationEnabled: true,
      numbersEnabled: true,
      mode: 'sprint',
      wordCount: 25,
    });
    expect(out.split(' ')).toHaveLength(25);
  });

  it('rend MOINS de N mots quand la source est plus courte que N (le chip surpromet)', () => {
    // selectFromTexts relâche le minimum de mots quand le pool ciblé est vide ;
    // truncateToWords ne fait que couper, jamais compléter. Un chip "100" peut
    // donc afficher un texte de 12 mots.
    const src = 'un deux trois quatre cinq six sept huit neuf dix onze douze';
    const out = applyTextFilters(src, {
      punctuationEnabled: true,
      numbersEnabled: true,
      mode: 'sprint',
      wordCount: 100,
    });
    expect(out.split(' ').length).toBe(12);
    expect(out.split(' ').length).toBeLessThan(100);
  });
});

describe('mode Temps (classic) : pas de troncature', () => {
  it('ne touche pas au nombre de mots, quelle que soit la valeur wordCount', () => {
    const src = Array.from({ length: 60 }, (_, i) => `mot${i}`).join(' ');
    const out = applyTextFilters(src, {
      punctuationEnabled: true,
      numbersEnabled: true,
      mode: 'classic',
      wordCount: 10,
    });
    expect(out.split(' ')).toHaveLength(60);
  });
});

describe('toggle ponctuation OFF : garde ce qui vit dans le mot', () => {
  it('conserve les apostrophes internes des citations françaises', () => {
    const src = "L'histoire n'est que le tableau des crimes et des malheurs";
    const out = applyTextFilters(src, {
      punctuationEnabled: false,
      numbersEnabled: true,
      mode: 'classic',
      wordCount: 25,
    });
    expect(out).toBe(src);
    expect(out).toContain("'");
  });

  it('conserve le trait d\'union des mots composés', () => {
    const src = 'un je-ne-sais-quoi de peut-être bien vu';
    const out = applyTextFilters(src, {
      punctuationEnabled: false,
      numbersEnabled: true,
      mode: 'classic',
      wordCount: 25,
    });
    expect(out).toBe(src);
  });

  it("retire la ponctuation de phrase d'un incipit anglais (points, virgules, tirets isolés)", () => {
    const emDash = String.fromCharCode(0x2014);
    const src = `Call me Ishmael. Some years ago${emDash} never mind, how long precisely.`;
    const out = applyTextFilters(src, {
      punctuationEnabled: false,
      numbersEnabled: true,
      mode: 'classic',
      wordCount: 25,
    });
    expect(out).toBe('Call me Ishmael Some years ago never mind how long precisely');
  });

  it('conserve les accents (seule la ponctuation part)', () => {
    const src = "C'était le meilleur des temps, c'était le pire des temps";
    const out = applyTextFilters(src, {
      punctuationEnabled: false,
      numbersEnabled: true,
      mode: 'classic',
      wordCount: 25,
    });
    expect(out).toContain('était');
  });
});

describe('toggle chiffres OFF', () => {
  it('retire les chiffres du texte', () => {
    const src = 'Le 15 mai 1796 le general Bonaparte entra dans Milan';
    const out = applyTextFilters(src, {
      punctuationEnabled: true,
      numbersEnabled: false,
      mode: 'classic',
      wordCount: 25,
    });
    expect(out).not.toMatch(/[0-9]/);
    expect(out).toContain('mai');
  });
});
