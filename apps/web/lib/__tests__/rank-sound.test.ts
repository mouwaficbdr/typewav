import type { RankTier } from '@typewav/types';
import { describe, expect, it } from 'vitest';

import { clampVelocity, getRankSoundProfile } from '../rank-sound';

// Paliers, du plus bas au plus haut.
const RANKS_LOW_TO_HIGH: RankTier[] = [
  'novice',
  'apprentice',
  'operator',
  'architect',
  'ghost',
];

describe('getRankSoundProfile', () => {
  it('renvoie un profil complet pour chaque rang', () => {
    for (const rank of RANKS_LOW_TO_HIGH) {
      const p = getRankSoundProfile(rank);
      expect(Number.isFinite(p.reverbWet)).toBe(true);
      expect(Number.isFinite(p.reverbDecaySec)).toBe(true);
      expect(Number.isFinite(p.velocityFloor)).toBe(true);
      expect(Number.isFinite(p.releaseSec)).toBe(true);
    }
  });

  it('garde toutes les valeurs dans des bornes audio sûres', () => {
    for (const rank of RANKS_LOW_TO_HIGH) {
      const p = getRankSoundProfile(rank);
      expect(p.reverbWet).toBeGreaterThan(0);
      expect(p.reverbWet).toBeLessThanOrEqual(1);
      expect(p.reverbDecaySec).toBeGreaterThan(0);
      expect(p.reverbDecaySec).toBeLessThanOrEqual(4);
      expect(p.velocityFloor).toBeGreaterThan(0);
      expect(p.velocityFloor).toBeLessThan(1);
      expect(p.releaseSec).toBeGreaterThan(0);
      expect(p.releaseSec).toBeLessThanOrEqual(4);
    }
  });

  it('enrichit la réverbe de façon monotone et perceptible entre rangs voisins', () => {
    for (let i = 1; i < RANKS_LOW_TO_HIGH.length; i++) {
      const prev = getRankSoundProfile(RANKS_LOW_TO_HIGH[i - 1]!);
      const curr = getRankSoundProfile(RANKS_LOW_TO_HIGH[i]!);
      // Perceptible sur un haut-parleur de portable, pas seulement au casque.
      expect(curr.reverbWet - prev.reverbWet).toBeGreaterThanOrEqual(0.05);
      expect(curr.reverbDecaySec - prev.reverbDecaySec).toBeGreaterThanOrEqual(
        0.35,
      );
    }
  });

  it('abaisse le plancher de vélocité au fil des rangs (jeu plus nuancé)', () => {
    for (let i = 1; i < RANKS_LOW_TO_HIGH.length; i++) {
      const prev = getRankSoundProfile(RANKS_LOW_TO_HIGH[i - 1]!);
      const curr = getRankSoundProfile(RANKS_LOW_TO_HIGH[i]!);
      expect(curr.velocityFloor).toBeLessThan(prev.velocityFloor);
    }
    const novice = getRankSoundProfile('novice');
    const ghost = getRankSoundProfile('ghost');
    // Au sommet, la dynamique du bas du clavier est au moins deux fois plus large.
    expect(ghost.velocityFloor).toBeLessThanOrEqual(novice.velocityFloor * 0.55);
  });

  it('allonge le release de façon monotone (notes plus liées au rang haut)', () => {
    for (let i = 1; i < RANKS_LOW_TO_HIGH.length; i++) {
      const prev = getRankSoundProfile(RANKS_LOW_TO_HIGH[i - 1]!);
      const curr = getRankSoundProfile(RANKS_LOW_TO_HIGH[i]!);
      expect(curr.releaseSec).toBeGreaterThanOrEqual(prev.releaseSec);
    }
  });

  it('ne fait pas régresser le rang novice sous le réglage piano actuel', () => {
    // PACK_CONFIGS.piano aujourd'hui : reverbWet 0.25, reverb decay 0.30,
    // plancher de vélocité 0.20, release sampler 1.8.
    const novice = getRankSoundProfile('novice');
    expect(novice.reverbWet).toBeLessThanOrEqual(0.25);
    expect(novice.reverbDecaySec).toBeLessThanOrEqual(0.3);
    expect(novice.velocityFloor).toBeLessThanOrEqual(0.2);
    expect(novice.releaseSec).toBeLessThanOrEqual(1.8);
  });
});

describe('clampVelocity', () => {
  it('mappe la vélocité MIDI 0-127 vers 0-1 en respectant le plancher', () => {
    expect(clampVelocity(127, 0.2)).toBe(1);
    expect(clampVelocity(0, 0.2)).toBe(0.2);
    expect(clampVelocity(64, 0.2)).toBeCloseTo(64 / 127, 5);
  });

  it('applique un plancher plus bas au rang haut (plus de dynamique)', () => {
    const noviceFloor = getRankSoundProfile('novice').velocityFloor;
    const ghostFloor = getRankSoundProfile('ghost').velocityFloor;
    expect(clampVelocity(8, ghostFloor)).toBeLessThan(
      clampVelocity(8, noviceFloor),
    );
  });

  it("retombe sur une vélocité médiane bornée par le plancher si l'entrée est invalide", () => {
    expect(clampVelocity(Number.NaN, 0.2)).toBe(0.75);
    expect(clampVelocity(Number.POSITIVE_INFINITY, 0.9)).toBe(0.9);
  });
});
