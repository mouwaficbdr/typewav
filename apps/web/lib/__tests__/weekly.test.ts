import type { SessionResult } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import { calculateWeeklySummary, detectPlateau } from '../weekly';

// Usine à sessions de test
function makeSession(
  overrides: Partial<SessionResult> & { wpm: number },
  timestamp: number,
): SessionResult {
  return {
    id: `s-${timestamp}`,
    timestamp,
    wpm: overrides.wpm,
    wpmNet: overrides.wpmNet ?? overrides.wpm,
    accuracy: overrides.accuracy ?? 95,
    consistency: overrides.consistency ?? 85,
    duration: overrides.duration ?? 60_000,
    mode: overrides.mode ?? 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: overrides.keystrokeData ?? [],
  };
}

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe('calculateWeeklySummary', () => {
  it('calcule correctement avgWpm sur la semaine courante', () => {
    const sessions = [
      makeSession({ wpm: 60 }, NOW - 1 * DAY),
      makeSession({ wpm: 70 }, NOW - 2 * DAY),
      makeSession({ wpm: 80 }, NOW - 3 * DAY),
    ];
    const summary = calculateWeeklySummary(sessions, NOW);
    expect(summary.avgWpm).toBe(70);
    expect(summary.sessionsCount).toBe(3);
  });

  it('exclut les sessions hors de la semaine courante', () => {
    const sessions = [
      makeSession({ wpm: 70 }, NOW - 3 * DAY), // dans la semaine
      makeSession({ wpm: 100 }, NOW - 10 * DAY), // hors semaine
    ];
    const summary = calculateWeeklySummary(sessions, NOW);
    expect(summary.sessionsCount).toBe(1);
    expect(summary.avgWpm).toBe(70);
  });

  it('calcule wpmDelta par rapport à la semaine précédente', () => {
    const sessions = [
      makeSession({ wpm: 80 }, NOW - 2 * DAY), // semaine courante
      makeSession({ wpm: 60 }, NOW - 9 * DAY), // semaine précédente
    ];
    const summary = calculateWeeklySummary(sessions, NOW);
    expect(summary.wpmDelta).toBe(20);
  });

  it('retourne des valeurs vides si aucune session cette semaine', () => {
    const sessions = [makeSession({ wpm: 60 }, NOW - 20 * DAY)];
    const summary = calculateWeeklySummary(sessions, NOW);
    expect(summary.avgWpm).toBe(0);
    expect(summary.sessionsCount).toBe(0);
    expect(summary.wpmDelta).toBe(0);
    expect(summary.bestDayIndex).toBe(-1);
  });

  it('bestDayIndex est le jour de semaine (0-6) le plus fréquenté', () => {
    // 3 sessions groupées sur un même jour, 1 sur un autre.
    const heavyDay = NOW - 2 * DAY;
    const lightDay = NOW - 4 * DAY;
    const sessions = [
      makeSession({ wpm: 60 }, heavyDay),
      makeSession({ wpm: 61 }, heavyDay - 60_000),
      makeSession({ wpm: 62 }, heavyDay - 120_000),
      makeSession({ wpm: 70 }, lightDay),
    ];
    const summary = calculateWeeklySummary(sessions, NOW);
    // Indice locale-agnostique : Date.getDay() côté impl comme côté test.
    expect(summary.bestDayIndex).toBe(new Date(heavyDay).getDay());
  });
});

describe('detectPlateau', () => {
  it('détecte un plateau sur 14 sessions stables', () => {
    // 14 sessions consécutives avec WPM variant de moins de 2
    const sessions = Array.from({ length: 14 }, (_, i) =>
      makeSession({ wpm: 60 + (i % 2 === 0 ? 0 : 1) }, NOW - (14 - i) * DAY),
    );
    const result = detectPlateau(sessions);
    expect(result).not.toBeNull();
    expect(result!.medianWpm).toBeGreaterThanOrEqual(60);
  });

  it('ne détecte pas de plateau si amélioration > 2 WPM', () => {
    // WPM croissant régulièrement (+5 par session)
    const sessions = Array.from({ length: 14 }, (_, i) =>
      makeSession({ wpm: 50 + i * 5 }, NOW - (14 - i) * DAY),
    );
    const result = detectPlateau(sessions);
    expect(result).toBeNull();
  });

  it('retourne null si moins de 14 sessions', () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ wpm: 60 }, NOW - i * DAY),
    );
    expect(detectPlateau(sessions)).toBeNull();
  });

  it('retourne une recommandation valide', () => {
    const validRecommendations = [
      'practice_punctuation',
      'practice_numbers',
      'practice_bigrams',
      'increase_duration',
      'try_new_collection',
    ];
    const sessions = Array.from({ length: 14 }, (_, i) =>
      makeSession({ wpm: 62 }, NOW - (14 - i) * DAY),
    );
    const result = detectPlateau(sessions);
    expect(validRecommendations).toContain(result!.recommendation);
  });

  it('startIndex indique la position du début du plateau', () => {
    // Amélioration d'abord (WPM 40→70), puis plateau à 80
    // improving[4] = 80 = même WPM que le plateau → le plateau inclut cet index
    const improving = Array.from({ length: 5 }, (_, i) =>
      makeSession({ wpm: 40 + i * 10 }, NOW - (20 - i) * DAY),
    );
    const plateau = Array.from({ length: 14 }, (_, i) =>
      makeSession({ wpm: 80 }, NOW - (15 - i) * DAY),
    );
    const result = detectPlateau([...improving, ...plateau]);
    expect(result).not.toBeNull();
    // improving[4] = 80 = plateau, donc le plateau commence à l'index 4
    expect(result!.startIndex).toBe(4);
  });
});
