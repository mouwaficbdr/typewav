import { describe, expect, it } from 'vitest';
import {
  evaluateAdaptation,
  filterWordsByComplexity,
  type AdaptiveSignals,
} from '../adaptive';

const baseSignals: AdaptiveSignals = {
  recentWpm: 60,
  recentAccuracy: 95,
  consistency: 80,
  baseline: 60,
  msSinceLastChange: 5_000,
};

describe('evaluateAdaptation', () => {
  it('augmente la complexité en flow parfait', () => {
    const signals: AdaptiveSignals = {
      ...baseSignals,
      recentWpm: 70, // > baseline * 1.1 (66)
      recentAccuracy: 97, // > 95
      consistency: 90, // > 85
    };
    const action = evaluateAdaptation(signals);
    expect(action.wordComplexity).toBe(1);
    expect(action.tempoMultiplier).toBeGreaterThan(1);
    expect(action.introduceNewCharType).toBe(false);
  });

  it('diminue la complexité sur chute accuracy', () => {
    const signals: AdaptiveSignals = {
      ...baseSignals,
      recentAccuracy: 75, // < 80
    };
    const action = evaluateAdaptation(signals);
    expect(action.wordComplexity).toBe(-1);
    expect(action.tempoMultiplier).toBeLessThan(1);
  });

  it('diminue la complexité sur chute WPM', () => {
    const signals: AdaptiveSignals = {
      ...baseSignals,
      recentWpm: 40, // < baseline * 0.8 (48)
      recentAccuracy: 85,
    };
    const action = evaluateAdaptation(signals);
    expect(action.wordComplexity).toBe(-1);
  });

  it('ne change rien sur performance normale', () => {
    const action = evaluateAdaptation(baseSignals);
    expect(action.wordComplexity).toBe(0);
    expect(action.tempoMultiplier).toBe(1.0);
    expect(action.introduceNewCharType).toBe(false);
  });

  it('introduit un nouveau type de caractère après stagnation (> 30s)', () => {
    const signals: AdaptiveSignals = {
      ...baseSignals,
      msSinceLastChange: 35_000, // > 30s
    };
    const action = evaluateAdaptation(signals);
    expect(action.introduceNewCharType).toBe(true);
    expect(action.wordComplexity).toBe(0);
  });

  it('la stagnation ne déclenche pas si < 30s', () => {
    const signals: AdaptiveSignals = {
      ...baseSignals,
      msSinceLastChange: 20_000,
    };
    const action = evaluateAdaptation(signals);
    expect(action.introduceNewCharType).toBe(false);
  });
});

describe('filterWordsByComplexity', () => {
  const words = [
    'ab',
    'abc',
    'abcd', // 2-4 lettres
    'abcde',
    'abcdef',
    'abcdefg', // 5-7 lettres
    'abcdefgh',
    'abcdefghij', // 8-10 lettres
    'abcdefghijk',
    'abcdefghijklm', // 11+ lettres
  ];

  it('niveau 1 : retourne uniquement les mots courts (≤4 lettres)', () => {
    const result = filterWordsByComplexity(words, 1);
    expect(result.every((w) => w.length <= 4)).toBe(true);
  });

  it('niveau 5 : retourne les mots très longs (≥9 lettres)', () => {
    const result = filterWordsByComplexity(words, 5);
    expect(result.every((w) => w.length >= 9)).toBe(true);
  });

  it('fallback : retourne tous les mots si trop peu passent le filtre', () => {
    const smallList = ['ab', 'cd'];
    const result = filterWordsByComplexity(smallList, 5);
    expect(result).toEqual(smallList);
  });

  it('clamp : complex 0 → traité comme 1', () => {
    const result = filterWordsByComplexity(words, 0);
    expect(result.every((w) => w.length <= 4)).toBe(true);
  });

  it('clamp : complex 10 → traité comme 5', () => {
    const result = filterWordsByComplexity(words, 10);
    expect(result.every((w) => w.length >= 9)).toBe(true);
  });
});
