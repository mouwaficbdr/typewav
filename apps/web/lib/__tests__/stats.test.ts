import type { KeystrokeEntry, SessionResult } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import {
  calculateAccuracy,
  calculateConsistency,
  calculateWPM,
  detectBigramSlowdowns,
  detectFatigue,
  generateRecommendation,
} from '../stats';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeKeystrokes(
  chars: string,
  intervalMs: number,
  startTs = 1_000,
  allCorrect = true,
): KeystrokeEntry[] {
  return chars.split('').map((char, i) => ({
    char,
    timestamp: startTs + i * intervalMs,
    correct: allCorrect,
    deltaMs: i === 0 ? 0 : intervalMs,
  }));
}

// ─── calculateWPM ─────────────────────────────────────────────────────────────

describe('calculateWPM', () => {
  it('retourne 0 si aucune frappe', () => {
    expect(calculateWPM([], 30_000)).toBe(0);
  });

  it('retourne 0 si durée est 0', () => {
    const ks = makeKeystrokes('hello', 200);
    expect(calculateWPM(ks, 0)).toBe(0);
  });

  it('calcule correctement : 60 chars corrects en 30 s = 24 WPM', () => {
    // 60 chars / 5 = 12 mots. 30 s = 0.5 min. 12 / 0.5 = 24 WPM
    const ks = makeKeystrokes('a'.repeat(60), 500);
    expect(calculateWPM(ks, 30_000)).toBe(24);
  });

  it('ignore les frappes incorrectes', () => {
    const ks: KeystrokeEntry[] = [
      { char: 'a', timestamp: 1000, correct: true, deltaMs: 0 },
      { char: 'x', timestamp: 1500, correct: false, deltaMs: 500 },
      { char: 'b', timestamp: 2000, correct: true, deltaMs: 500 },
    ];
    // 2 chars corrects / 5 = 0.4 mot. 1 s = 1/60 min. 0.4 / (1/60) = 24 WPM
    expect(calculateWPM(ks, 1_000)).toBeGreaterThan(0);
  });
});

// ─── calculateAccuracy ────────────────────────────────────────────────────────

describe('calculateAccuracy', () => {
  it('retourne 100 si aucune frappe', () => {
    expect(calculateAccuracy([])).toBe(100);
  });

  it('retourne 100 % si tout est correct', () => {
    const ks = makeKeystrokes('hello', 200);
    expect(calculateAccuracy(ks)).toBe(100);
  });

  it('retourne 0 % si tout est incorrect', () => {
    const ks = makeKeystrokes('hello', 200, 1000, false);
    expect(calculateAccuracy(ks)).toBe(0);
  });

  it('retourne 50 % pour moitié correcte', () => {
    const ks: KeystrokeEntry[] = [
      { char: 'a', timestamp: 1000, correct: true, deltaMs: 0 },
      { char: 'b', timestamp: 1200, correct: false, deltaMs: 200 },
      { char: 'c', timestamp: 1400, correct: true, deltaMs: 200 },
      { char: 'd', timestamp: 1600, correct: false, deltaMs: 200 },
    ];
    expect(calculateAccuracy(ks)).toBe(50);
  });
});

// ─── calculateConsistency ─────────────────────────────────────────────────────

describe('calculateConsistency', () => {
  it('retourne 100 pour une session très courte', () => {
    const ks = makeKeystrokes('hi', 200);
    expect(calculateConsistency(ks)).toBe(100);
  });

  it('retourne une valeur haute pour un rythme régulier', () => {
    // Rythme parfaitement régulier → σ proche de 0 → consistance proche de 100
    const ks = makeKeystrokes('a'.repeat(200), 300);
    expect(calculateConsistency(ks, 5_000)).toBeGreaterThan(80);
  });

  it('retourne une valeur basse pour un rythme très irrégulier', () => {
    const ks: KeystrokeEntry[] = [];
    let ts = 1000;
    // 1ère moitié très rapide
    for (let i = 0; i < 50; i++) {
      ks.push({
        char: 'a',
        timestamp: ts,
        correct: true,
        deltaMs: i === 0 ? 0 : 100,
      });
      ts += 100;
    }
    // 2ème moitié très lente
    for (let i = 0; i < 50; i++) {
      ks.push({ char: 'a', timestamp: ts, correct: true, deltaMs: 2000 });
      ts += 2000;
    }
    expect(calculateConsistency(ks, 5_000)).toBeLessThan(80);
  });
});

// ─── detectBigramSlowdowns ────────────────────────────────────────────────────

describe('detectBigramSlowdowns', () => {
  it('retourne un tableau vide si < 2 frappes', () => {
    const ks = makeKeystrokes('a', 200);
    expect(detectBigramSlowdowns(ks)).toHaveLength(0);
  });

  it('retourne au maximum 5 bigrams', () => {
    const ks = makeKeystrokes('abcdefghijklmnopqrstuvwxyz', 200);
    const result = detectBigramSlowdowns(ks);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('trie les bigrams du plus lent au plus rapide', () => {
    const ks: KeystrokeEntry[] = [
      { char: 'a', timestamp: 1000, correct: true, deltaMs: 0 },
      { char: 'b', timestamp: 2000, correct: true, deltaMs: 1000 }, // ab : 1000ms
      { char: 'c', timestamp: 2200, correct: true, deltaMs: 200 }, // bc : 200ms
      { char: 'd', timestamp: 4200, correct: true, deltaMs: 2000 }, // cd : 2000ms
      { char: 'e', timestamp: 4400, correct: true, deltaMs: 200 }, // de : 200ms
    ];
    const result = detectBigramSlowdowns(ks);
    if (result.length >= 2) {
      expect(result[0]!.avgMs).toBeGreaterThanOrEqual(result[1]!.avgMs);
    }
  });
});

// ─── detectFatigue ────────────────────────────────────────────────────────────

describe('detectFatigue', () => {
  it('retourne "none" si < 10 frappes', () => {
    const ks = makeKeystrokes('hello', 200);
    expect(detectFatigue(ks)).toBe('none');
  });

  it('retourne "none" si la vitesse reste stable', () => {
    const ks = makeKeystrokes('a'.repeat(100), 200);
    expect(detectFatigue(ks)).toBe('none');
  });

  it('retourne "severe" si la 2ème moitié est > 30 % plus lente', () => {
    const ks: KeystrokeEntry[] = [];
    let ts = 1000;
    // 1ère moitié : 100 ms par frappe
    for (let i = 0; i < 20; i++) {
      ks.push({
        char: 'a',
        timestamp: ts,
        correct: true,
        deltaMs: i === 0 ? 0 : 100,
      });
      ts += 100;
    }
    // 2ème moitié : 600 ms par frappe (> 30 % de chute)
    for (let i = 0; i < 20; i++) {
      ks.push({ char: 'a', timestamp: ts, correct: true, deltaMs: 600 });
      ts += 600;
    }
    expect(detectFatigue(ks)).toBe('severe');
  });
});

// ─── generateRecommendation ───────────────────────────────────────────────────

describe('generateRecommendation', () => {
  const baseSession: SessionResult = {
    id: 'test-1',
    timestamp: Date.now(),
    wpm: 70,
    wpmNet: 65,
    accuracy: 96,
    consistency: 85,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: makeKeystrokes('a'.repeat(100), 300),
  };

  it('retourne toujours une string non vide', () => {
    expect(generateRecommendation(baseSession).length).toBeGreaterThan(0);
  });

  it("mentionne l'accuracy si elle est < 90 %", () => {
    const session = { ...baseSession, accuracy: 85 };
    expect(generateRecommendation(session).toLowerCase()).toContain('accuracy');
  });

  it('mentionne la consistance si elle est < 70 %', () => {
    const session = { ...baseSession, consistency: 60 };
    const rec = generateRecommendation(session);
    expect(rec.toLowerCase()).toContain('consist');
  });
});
