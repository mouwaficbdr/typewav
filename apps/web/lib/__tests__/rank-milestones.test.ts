import { describe, expect, it } from 'vitest';
import type { SessionResult } from '@typewav/types';
import {
  firstSessionIdPerTier,
  rankUpSessionIds,
} from '@/lib/rank-milestones';

function sessionsWithWpm(wpms: number[]): SessionResult[] {
  return wpms.map((wpm, i) => ({
    id: `s-${i}`,
    timestamp: 1_700_000_000_000 + i * 86_400_000,
    wpm,
    wpmNet: wpm - 2,
    accuracy: 95,
    consistency: 80,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    collectionId: 'litterature',
    soundPackId: 'piano',
    keystrokeData: [],
  }));
}

describe('firstSessionIdPerTier', () => {
  it('repère la première séance à franchir chaque seuil', () => {
    // seuils : apprentice 31, operator 51, architect 71, ghost 91
    const s = sessionsWithWpm([20, 35, 45, 55, 72, 40]);
    expect(firstSessionIdPerTier(s)).toEqual({
      apprentice: 's-1', // wpm 35
      operator: 's-3', // wpm 55
      architect: 's-4', // wpm 72
    });
  });

  it('ne liste que les paliers réellement atteints', () => {
    expect(firstSessionIdPerTier(sessionsWithWpm([10, 20, 25]))).toEqual({});
  });

  it('historique vide -> objet vide', () => {
    expect(firstSessionIdPerTier([])).toEqual({});
  });

  it('novice (seuil 0) n’est jamais un marqueur', () => {
    const out = firstSessionIdPerTier(sessionsWithWpm([5, 40]));
    expect(out).not.toHaveProperty('novice');
    expect(out.apprentice).toBe('s-1');
  });

  it('rankUpSessionIds déduplique quand une séance franchit deux paliers', () => {
    // une seule séance à 95 wpm franchit apprentice + operator + architect + ghost
    const ids = rankUpSessionIds(sessionsWithWpm([95]));
    expect(ids).toEqual(['s-0']);
  });
});
