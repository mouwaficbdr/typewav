import type { SessionResult, UserProfile } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import {
  calculateRank,
  checkMilestones,
  rankTierForWpm,
  updatePersonalRecords,
} from '../progression';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    wpm: 60,
    wpmNet: 58,
    accuracy: 95,
    consistency: 85,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: [],
    ...overrides,
  };
}

const emptyProfile: UserProfile = {
  unlockedThemes: ['terminal'],
  unlockedCollections: ['litterature'],
  unlockedMilestoneIds: [],
  currentRank: 'novice',
  pseudo: '',
};

// ─── calculateRank ─────────────────────────────────────────────────────────────

describe('calculateRank', () => {
  it('retourne novice pour 0 sessions', () => {
    expect(calculateRank([])).toBe('novice');
  });

  it('retourne novice pour médiane WPM ≤ 30', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ wpm: 25 }));
    expect(calculateRank(sessions)).toBe('novice');
  });

  it('retourne apprentice pour médiane WPM 31-50', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ wpm: 40 }));
    expect(calculateRank(sessions)).toBe('apprentice');
  });

  it('retourne operator pour médiane WPM 51-70', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ wpm: 60 }));
    expect(calculateRank(sessions)).toBe('operator');
  });

  it('retourne architect pour médiane WPM 71-90', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ wpm: 80 }));
    expect(calculateRank(sessions)).toBe('architect');
  });

  it('retourne ghost uniquement à 91+ WPM médian', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ wpm: 100 }));
    expect(calculateRank(sessions)).toBe('ghost');
  });

  it("n'utilise que les 10 dernières sessions", () => {
    // 15 sessions à 100 WPM (anciennes) + 10 récentes à 20 WPM
    const old = Array.from({ length: 15 }, () => makeSession({ wpm: 100 }));
    // Les plus récentes doivent apparaître en tête de liste
    const recent = Array.from({ length: 10 }, () => makeSession({ wpm: 20 }));
    // slice(0, 10) = 10 sessions à 20 WPM → médiane = 20 → novice
    expect(calculateRank([...recent, ...old])).toBe('novice');
  });

  it('exclut les modes non compétitifs (zen, learning, endurance) de la médiane', () => {
    // Sessions zen à 100 WPM (devraient être ignorées) + classic à 25 WPM
    const zen = Array.from({ length: 5 }, () =>
      makeSession({ wpm: 100, mode: 'zen' }),
    );
    const classic = Array.from({ length: 5 }, () =>
      makeSession({ wpm: 25, mode: 'classic' }),
    );
    expect(calculateRank([...zen, ...classic])).toBe('novice');
  });

  it('retourne novice si seules des sessions non compétitives existent', () => {
    const learning = Array.from({ length: 5 }, () =>
      makeSession({ wpm: 100, mode: 'learning' }),
    );
    expect(calculateRank(learning)).toBe('novice');
  });
});

// ─── rankTierForWpm ────────────────────────────────────────────────────────────

describe('rankTierForWpm', () => {
  it('retourne novice sous 31 WPM', () => {
    expect(rankTierForWpm(0)).toBe('novice');
    expect(rankTierForWpm(30)).toBe('novice');
  });

  it('retourne apprentice entre 31 et 50 WPM', () => {
    expect(rankTierForWpm(31)).toBe('apprentice');
    expect(rankTierForWpm(50)).toBe('apprentice');
  });

  it('retourne operator entre 51 et 70 WPM', () => {
    expect(rankTierForWpm(51)).toBe('operator');
    expect(rankTierForWpm(70)).toBe('operator');
  });

  it('retourne architect entre 71 et 90 WPM', () => {
    expect(rankTierForWpm(71)).toBe('architect');
    expect(rankTierForWpm(90)).toBe('architect');
  });

  it('retourne ghost à 91 WPM et plus', () => {
    expect(rankTierForWpm(91)).toBe('ghost');
    expect(rankTierForWpm(200)).toBe('ghost');
  });

  it('reste cohérent avec calculateRank pour une seule performance', () => {
    const single = [makeSession({ wpm: 85 })];
    expect(calculateRank(single)).toBe(rankTierForWpm(85));
  });
});

// ─── checkMilestones ───────────────────────────────────────────────────────────

describe('checkMilestones', () => {
  it('détecte le jalon first_session à la première session', () => {
    const sessions = [makeSession()];
    const newMilestones = checkMilestones(sessions, emptyProfile);
    expect(newMilestones.map((m) => m.id)).toContain('first_session');
  });

  it('ne redéclenche pas un jalon déjà débloqué', () => {
    const profile: UserProfile = {
      ...emptyProfile,
      unlockedMilestoneIds: ['first_session'],
    };
    const sessions = [makeSession()];
    const newMilestones = checkMilestones(sessions, profile);
    expect(newMilestones.map((m) => m.id)).not.toContain('first_session');
  });

  it('détecte le jalon wpm_50 quand session ≥ 50 WPM', () => {
    const sessions = [makeSession({ wpm: 55 })];
    const newMilestones = checkMilestones(sessions, emptyProfile);
    expect(newMilestones.map((m) => m.id)).toContain('wpm_50');
  });

  it('ne déclenche pas wpm_70 si la session est à 60 WPM', () => {
    const sessions = [makeSession({ wpm: 60 })];
    const newMilestones = checkMilestones(sessions, emptyProfile);
    expect(newMilestones.map((m) => m.id)).not.toContain('wpm_70');
  });

  it('retourne une liste vide si aucune condition remplie', () => {
    const sessions = [makeSession({ wpm: 10, accuracy: 50 })];
    // first_session devrait quand même se déclencher (1 session)
    const profile: UserProfile = {
      ...emptyProfile,
      unlockedMilestoneIds: ['first_session'],
    };
    const newMilestones = checkMilestones(sessions, profile);
    expect(newMilestones).toHaveLength(0);
  });
});

// ─── updatePersonalRecords ─────────────────────────────────────────────────────

describe('updatePersonalRecords', () => {
  it('initialise les records avec la première session', () => {
    const session = makeSession({ wpm: 70, accuracy: 97, consistency: 88 });
    const records = updatePersonalRecords(null, session);
    expect(records.maxWpm.value).toBe(70);
    expect(records.maxAccuracy.value).toBe(97);
    expect(records.maxConsistency.value).toBe(88);
  });

  it('met à jour maxWpm si la session est plus rapide', () => {
    const session1 = makeSession({ wpm: 70 });
    const records1 = updatePersonalRecords(null, session1);
    const session2 = makeSession({ wpm: 85 });
    const records2 = updatePersonalRecords(records1, session2);
    expect(records2.maxWpm.value).toBe(85);
  });

  it('ne modifie pas maxWpm si la session est plus lente', () => {
    const session1 = makeSession({ wpm: 80 });
    const records1 = updatePersonalRecords(null, session1);
    const session2 = makeSession({ wpm: 50 });
    const records2 = updatePersonalRecords(records1, session2);
    expect(records2.maxWpm.value).toBe(80);
  });

  it('stocke le record par collection', () => {
    const session = makeSession({ wpm: 75, collectionId: 'litterature' });
    const records = updatePersonalRecords(null, session);
    expect(records.byCollection['litterature']?.wpm).toBe(75);
  });

  it("est immutable — ne modifie pas l'original", () => {
    const session1 = makeSession({ wpm: 70 });
    const records = updatePersonalRecords(null, session1);
    const original = { ...records };
    const session2 = makeSession({ wpm: 90 });
    updatePersonalRecords(records, session2);
    expect(records.maxWpm.value).toBe(original.maxWpm.value);
  });

  it('ignore les sessions en mode non compétitif (zen, learning, endurance)', () => {
    const session1 = makeSession({ wpm: 70, mode: 'classic' });
    const records1 = updatePersonalRecords(null, session1);

    const zenSession = makeSession({ wpm: 200, mode: 'zen' });
    const records2 = updatePersonalRecords(records1, zenSession);
    expect(records2.maxWpm.value).toBe(70);

    const learningSession = makeSession({ wpm: 200, mode: 'learning' });
    const records3 = updatePersonalRecords(records2, learningSession);
    expect(records3.maxWpm.value).toBe(70);

    const enduranceSession = makeSession({ wpm: 200, mode: 'endurance' });
    const records4 = updatePersonalRecords(records3, enduranceSession);
    expect(records4.maxWpm.value).toBe(70);
  });
});
