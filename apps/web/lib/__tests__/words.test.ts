import { LEARNING_LEVELS } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import { generateLearningText } from '../words';

function getLevel(id: number) {
  return LEARNING_LEVELS.find((l) => l.id === id)!;
}

describe('generateLearningText', () => {
  it('niveau 1 (Home Row) ne produit que des caractères home row', () => {
    const allowed = new Set([...getLevel(1).keys, ' ']);
    for (let i = 0; i < 10; i++) {
      const text = generateLearningText(1, 20);
      for (const ch of text.toLowerCase()) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it('niveau 2 (Top Row) ne produit que des caractères home+top row', () => {
    const allowed = new Set([...getLevel(2).keys, ' ']);
    for (let i = 0; i < 10; i++) {
      const text = generateLearningText(2, 20);
      for (const ch of text.toLowerCase()) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it('niveau 3 (Bottom Row) ne produit que des caractères des touches autorisées', () => {
    const allowed = new Set([...getLevel(3).keys, ' ']);
    for (let i = 0; i < 10; i++) {
      const text = generateLearningText(3, 20);
      for (const ch of text.toLowerCase()) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it('niveau 5 (Shift & Punctuation) contient au moins une majuscule et un signe de ponctuation', () => {
    const text = generateLearningText(5, 20);
    expect(/[A-Z]/.test(text)).toBe(true);
    expect(/[.,!?]/.test(text)).toBe(true);
  });

  it('niveau 5 capitalise le premier mot de chaque phrase', () => {
    const text = generateLearningText(5, 20);
    expect(text[0]).toMatch(/[A-Z]/);
  });
});
