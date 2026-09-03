import type { KeystrokeEntry } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import { getSessionVerdict } from '../session-verdict';

/** Construit une suite de frappes correctes avec des intervalles donnés. */
function keys(deltas: number[], correctMask?: boolean[]): KeystrokeEntry[] {
  let t = 0;
  return deltas.map((d, i) => {
    t += d;
    return {
      char: 'a',
      timestamp: t,
      correct: correctMask ? (correctMask[i] ?? true) : true,
      deltaMs: d,
    };
  });
}

/** N frappes à intervalle constant. */
const steady = (n: number, d = 150) => keys(new Array<number>(n).fill(d));

describe('getSessionVerdict', () => {
  it('renvoie "brief" sous 12 frappes', () => {
    expect(
      getSessionVerdict({ keystrokes: steady(8), accuracy: 100, consistency: 90 }).kind,
    ).toBe('brief');
  });

  it('renvoie "flawless" quand aucune frappe fautive', () => {
    const v = getSessionVerdict({
      keystrokes: steady(40),
      accuracy: 100,
      consistency: 70,
    });
    expect(v.kind).toBe('flawless');
  });

  it('renvoie "fatigue" avec le pourcentage de ralentissement quand la 2e moitié traîne', () => {
    // 1re moitié à 120ms, 2e moitié à 180ms → +50%. Deux fautes pour ne pas
    // tomber sur "flawless" (qui prime).
    const mask = new Array<boolean>(40).fill(true);
    mask[7] = mask[22] = false;
    const ks = keys(
      [
        ...new Array<number>(20).fill(120),
        ...new Array<number>(20).fill(180),
      ],
      mask,
    );
    const v = getSessionVerdict({ keystrokes: ks, accuracy: 97, consistency: 60 });
    expect(v.kind).toBe('fatigue');
    if (v.kind === 'fatigue') expect(v.dropPct).toBe(50);
  });

  it('renvoie "accelerated" quand la 2e moitié est nettement plus rapide', () => {
    const mask = new Array<boolean>(40).fill(true);
    mask[7] = mask[22] = false;
    const ks = keys(
      [
        ...new Array<number>(20).fill(180),
        ...new Array<number>(20).fill(120),
      ],
      mask,
    );
    const v = getSessionVerdict({ keystrokes: ks, accuracy: 97, consistency: 60 });
    expect(v.kind).toBe('accelerated');
    if (v.kind === 'accelerated') expect(v.gainPct).toBeGreaterThanOrEqual(30);
  });

  it('renvoie "hesitation" avec le nombre de longues pauses (moitiés équilibrées, pas parfait)', () => {
    // médiane ~120ms ; 4 pauses à 500ms (> 3×médiane) réparties uniformément
    const base = new Array<number>(40).fill(120);
    base[8] = 500;
    base[16] = 500;
    base[24] = 500;
    base[33] = 500;
    const v = getSessionVerdict({
      keystrokes: keys(base, new Array<boolean>(40).fill(true).map((_, i) => i !== 5)),
      accuracy: 97,
      consistency: 60,
    });
    expect(v.kind).toBe('hesitation');
    if (v.kind === 'hesitation') expect(v.count).toBe(4);
  });

  it('renvoie "accuracy" quand la précision passe sous le plancher (sans pattern fatigue/hésitation)', () => {
    const mask = new Array<boolean>(40).fill(true);
    mask[3] = mask[10] = mask[19] = mask[28] = mask[35] = false; // 5 erreurs → 87.5%
    const v = getSessionVerdict({
      keystrokes: keys(new Array<number>(40).fill(140), mask),
      accuracy: 88,
      consistency: 85,
    });
    expect(v.kind).toBe('accuracy');
    if (v.kind === 'accuracy') expect(v.errors).toBe(5);
  });

  it('renvoie "metronomic" quand la régularité est haute, sans autre signal saillant', () => {
    const mask = new Array<boolean>(40).fill(true);
    mask[10] = mask[25] = false; // 2 erreurs → précision ~95, au-dessus du plancher
    const v = getSessionVerdict({
      keystrokes: keys(new Array<number>(40).fill(150), mask),
      accuracy: 95,
      consistency: 93,
    });
    expect(v.kind).toBe('metronomic');
  });

  it('renvoie "clean" en dernier recours', () => {
    const mask = new Array<boolean>(40).fill(true);
    mask[10] = mask[25] = false;
    const v = getSessionVerdict({
      keystrokes: keys(new Array<number>(40).fill(150), mask),
      accuracy: 95,
      consistency: 78,
    });
    expect(v.kind).toBe('clean');
  });

  it('est déterministe : même entrée, même verdict', () => {
    const ks = steady(30);
    const a = getSessionVerdict({ keystrokes: ks, accuracy: 99, consistency: 80 });
    const b = getSessionVerdict({ keystrokes: ks, accuracy: 99, consistency: 80 });
    expect(a).toEqual(b);
  });
});
