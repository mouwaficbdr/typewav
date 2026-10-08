import { describe, expect, it } from 'vitest';
import {
  LEARNING_PARAGRAPHS,
  WORDS_FR_ACCENTS,
  WORDS_FR_CIRCUMFLEX,
  WORDS_FR_PLAIN,
  WORDS_FR_PROPER,
} from '../learning-texts';

const ACCENT_DIRECT = /[éèàçù]/;
const CIRCUMFLEX = /[âêîôûëïü]/;

describe('pools de mots FR', () => {
  it('WORDS_FR_PLAIN : minuscules, aucun accent, aucune ponctuation, ≥ 120', () => {
    expect(WORDS_FR_PLAIN.length).toBeGreaterThanOrEqual(120);
    for (const w of WORDS_FR_PLAIN) {
      expect(w).toBe(w.toLowerCase());
      expect(ACCENT_DIRECT.test(w)).toBe(false);
      expect(CIRCUMFLEX.test(w)).toBe(false);
      expect(/^[a-z]+$/.test(w)).toBe(true);
    }
  });

  it('WORDS_FR_PROPER : capitalisés, sans accent, ≥ 30', () => {
    expect(WORDS_FR_PROPER.length).toBeGreaterThanOrEqual(30);
    for (const w of WORDS_FR_PROPER) {
      expect(w[0]).toBe(w[0]!.toUpperCase());
      expect(ACCENT_DIRECT.test(w)).toBe(false);
      expect(CIRCUMFLEX.test(w)).toBe(false);
    }
  });

  it('WORDS_FR_ACCENTS : au moins un accent direct, pas de circonflexe, ≥ 80', () => {
    expect(WORDS_FR_ACCENTS.length).toBeGreaterThanOrEqual(80);
    for (const w of WORDS_FR_ACCENTS) {
      expect(ACCENT_DIRECT.test(w)).toBe(true);
      expect(CIRCUMFLEX.test(w)).toBe(false);
    }
  });

  it('WORDS_FR_CIRCUMFLEX : au moins un circonflexe/tréma, ≥ 60', () => {
    expect(WORDS_FR_CIRCUMFLEX.length).toBeGreaterThanOrEqual(60);
    for (const w of WORDS_FR_CIRCUMFLEX) {
      expect(CIRCUMFLEX.test(w)).toBe(true);
    }
  });
});

describe('LEARNING_PARAGRAPHS', () => {
  it('≥ 4 paragraphes par tag', () => {
    for (const tag of ['punctuation', 'digits', 'full'] as const) {
      expect(LEARNING_PARAGRAPHS.filter((p) => p.tags.includes(tag)).length).toBeGreaterThanOrEqual(4);
    }
  });

  it('les paragraphes digits contiennent au moins un chiffre', () => {
    for (const p of LEARNING_PARAGRAPHS.filter((p) => p.tags.includes('digits'))) {
      expect(/[0-9]/.test(p.text)).toBe(true);
    }
  });

  it('les paragraphes full contiennent majuscule, accent, ponctuation et chiffre', () => {
    for (const p of LEARNING_PARAGRAPHS.filter((p) => p.tags.includes('full'))) {
      expect(/[A-Z]/.test(p.text)).toBe(true);
      expect(/[éèàçùâêîôûëïü]/.test(p.text)).toBe(true);
      expect(/[.,;:!?'-]/.test(p.text)).toBe(true);
      expect(/[0-9]/.test(p.text)).toBe(true);
    }
  });

  it('longueur 150-600 caractères', () => {
    for (const p of LEARNING_PARAGRAPHS) {
      expect(p.text.length).toBeGreaterThanOrEqual(150);
      expect(p.text.length).toBeLessThanOrEqual(600);
    }
  });
});
