import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';
import { applyLearningKeystrokes, type KeyMastery } from '../learning-progress';
import { generateLevelText, mapCharToGestureId } from '../learning-content';

/**
 * Atteignabilite : un joueur parfait (100 % de precision) doit pouvoir valider
 * chaque niveau en un nombre raisonnable de series, quel que soit le tirage.
 * Meme chemin que le composant : `generateLevelText`, puis les gestes de chaque
 * caractere alimentent la maitrise par touche.
 */
const MAX_RUNS = 15;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nombre de series pour valider le niveau, ou `null` si MAX_RUNS ne suffit pas. */
function runsToClear(level: (typeof LEARNING_CURRICULUM_AZERTY)[number]) {
  let mastery: KeyMastery = {};
  let samples = 0;
  for (let run = 1; run <= MAX_RUNS; run += 1) {
    const text = generateLevelText(level, mastery);
    const entries = [...text]
      .map((ch) => ({ gestureId: mapCharToGestureId(ch), correct: true }))
      .filter((e) => e.gestureId !== '');
    samples += entries.length;
    mastery = applyLearningKeystrokes(mastery, entries);
    const keysOk = level.newKeys.every(
      (k) => (mastery[k.id]?.total ?? 0) >= level.minSamplesPerKey,
    );
    const totalOk = samples >= (level.minSamplesTotal ?? 0);
    if (keysOk && totalOk) return run;
  }
  return null;
}

describe('atteignabilite des niveaux (precision parfaite)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const gated = LEARNING_CURRICULUM_AZERTY.filter(
    (l) => l.kind !== 'anchors' && (l.newKeys.length > 0 || l.kind === 'text'),
  );

  for (const level of gated) {
    it(`niveau ${level.id} (${level.slug}) se valide en ${MAX_RUNS} series ou moins`, () => {
      for (const seed of SEEDS) {
        vi.mocked(Math.random).mockImplementation(mulberry32(seed));
        expect(runsToClear(level), `graine ${seed}`).not.toBeNull();
      }
    });
  }
});
