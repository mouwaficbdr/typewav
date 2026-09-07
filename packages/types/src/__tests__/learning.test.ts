import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_VERSION,
  DEAD_KEYS,
  LEARNING_CURRICULUM_AZERTY,
  type FingerId,
} from '../learning';

const FINGERS: FingerId[] = ['LP', 'LR', 'LM', 'LI', 'RI', 'RM', 'RR', 'RP', 'LT', 'RT'];

describe('LEARNING_CURRICULUM_AZERTY', () => {
  it('a 11 niveaux numérotés 1..11 dans l’ordre', () => {
    expect(LEARNING_CURRICULUM_AZERTY.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('CURRICULUM_VERSION est un entier positif', () => {
    expect(Number.isInteger(CURRICULUM_VERSION)).toBe(true);
    expect(CURRICULUM_VERSION).toBeGreaterThan(0);
  });

  it('chaque newKey a un finger valide', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      for (const k of level.newKeys) {
        expect(FINGERS).toContain(k.finger);
      }
    }
  });

  it('les ids de geste sont uniques sur l’ensemble des newKeys (hors niveaux anchors)', () => {
    const ids = LEARNING_CURRICULUM_AZERTY
      .filter((l) => l.kind !== 'anchors')
      .flatMap((l) => l.newKeys.map((k) => k.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('poolKeys de chaque niveau est un sur-ensemble de (poolKeys précédent ∪ newKeys du niveau)', () => {
    let prev = new Set<string>();
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      const pool = new Set(level.poolKeys);
      for (const id of prev) expect(pool.has(id)).toBe(true);
      for (const k of level.newKeys) expect(pool.has(k.id)).toBe(true);
      prev = pool;
    }
  });

  it('toute clé layer:"deadkey" référence un deadKey connu', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      for (const k of level.newKeys) {
        if (k.layer === 'deadkey') {
          expect(k.deadKey).toBeDefined();
          expect(Object.keys(DEAD_KEYS)).toContain(k.deadKey!);
        }
      }
    }
  });

  it('le niveau 11 est kind:"text" avec minOverallAccuracy et minSamplesTotal', () => {
    const last = LEARNING_CURRICULUM_AZERTY[10]!;
    expect(last.kind).toBe('text');
    expect(last.minOverallAccuracy).toBeGreaterThan(0);
    expect(last.minSamplesTotal).toBeGreaterThan(0);
  });

  it('le niveau 6 poolKeys contient les 26 majuscules', () => {
    const l6 = LEARNING_CURRICULUM_AZERTY[5]!;
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(l6.poolKeys).toContain(c);
    }
  });

  it('les niveaux drill/words ont minAccuracyPerKey=90 et minSamplesPerKey=20 (sauf niveau 1)', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      if (level.id === 1) {
        expect(level.minSamplesPerKey).toBe(1);
        continue;
      }
      expect(level.minAccuracyPerKey).toBe(90);
      expect(level.minSamplesPerKey).toBe(20);
    }
  });
});
