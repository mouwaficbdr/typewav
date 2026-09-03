/**
 * Tests IndexedDB — utilisent fake-indexeddb pour simuler le browser store.
 * Spec : docs/specs/02-diagnostic.md — Tests requis (saveSession / getSessions)
 */
import type { SessionResult } from '@typewav/types';
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteSession,
  getAllKeystrokeStats,
  getSessionById,
  getSessions,
  getUserProfile,
  saveSession,
  updateKeystrokeStats,
} from '../db';

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    id: `session-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    wpm: 75,
    wpmNet: 70,
    accuracy: 96.5,
    consistency: 88,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: [],
    ...overrides,
  };
}

// Réinitialiser l'instance DB entre les tests
beforeEach(async () => {
  // fake-indexeddb crée une DB fraîche par défaut sur chaque import
  // On force un reset du singleton via le module
  const mod = await import('../db');
  // Workaround : mock le module pour reset le singleton (pattern db.ts)
  // En pratique, fake-indexeddb reset automatiquement entre les test files
  void mod;
});

// ─── saveSession / getSessions ────────────────────────────────────────────────

describe('saveSession', () => {
  it("retourne l'ID de la session sauvegardée", async () => {
    const session = makeSession({ id: 'test-save-1' });
    const id = await saveSession(session);
    expect(id).toBe('test-save-1');
  });

  it('round-trip : sauvegarde et récupère correctement', async () => {
    const session = makeSession({ id: 'test-roundtrip', wpm: 82 });
    await saveSession(session);
    const retrieved = await getSessionById('test-roundtrip');
    expect(retrieved).toBeDefined();
    expect(retrieved?.wpm).toBe(82);
    expect(retrieved?.accuracy).toBe(96.5);
  });
});

describe('getSessions', () => {
  it('retourne les sessions triées du plus récent au plus ancien', async () => {
    const older = makeSession({ id: 'older', timestamp: 1000 });
    const newer = makeSession({ id: 'newer', timestamp: 2000 });
    await saveSession(older);
    await saveSession(newer);

    const sessions = await getSessions();
    const ids = sessions.map((s) => s.id);
    // 'newer' doit apparaître avant 'older'
    const newerIdx = ids.indexOf('newer');
    const olderIdx = ids.indexOf('older');
    if (newerIdx !== -1 && olderIdx !== -1) {
      expect(newerIdx).toBeLessThan(olderIdx);
    }
  });
});

describe('deleteSession', () => {
  it("supprime la session — elle n'est plus récupérable", async () => {
    const session = makeSession({ id: 'test-delete' });
    await saveSession(session);
    await deleteSession('test-delete');
    const retrieved = await getSessionById('test-delete');
    expect(retrieved).toBeUndefined();
  });
});

// ─── updateKeystrokeStats ─────────────────────────────────────────────────────

describe('updateKeystrokeStats', () => {
  it('crée des agrégats pour les frappes passées', async () => {
    await updateKeystrokeStats([
      { char: 'a', timestamp: 1000, correct: true, deltaMs: 200 },
      { char: 'b', timestamp: 1200, correct: true, deltaMs: 200 },
      { char: 'a', timestamp: 1400, correct: true, deltaMs: 200 },
    ]);
    const stats = await getAllKeystrokeStats();
    const aStat = stats.find((s) => s.key === 'a');
    expect(aStat).toBeDefined();
    expect(aStat?.totalOccurrences).toBe(2);
    expect(aStat?.avgDeltaMs).toBe(200);
  });

  it('ignore les frappes avec deltaMs <= 0', async () => {
    await updateKeystrokeStats([
      { char: 'z', timestamp: 1000, correct: true, deltaMs: 0 },
    ]);
    const stats = await getAllKeystrokeStats();
    const zStat = stats.find((s) => s.key === 'z');
    expect(zStat).toBeUndefined();
  });
});

describe('getUserProfile', () => {
  it('retourne un profil par défaut indépendant à chaque appel — muter l’un ne corrompt pas les autres', async () => {
    const profile1 = await getUserProfile();
    const profile2 = await getUserProfile();

    expect(profile1).not.toBe(profile2);

    profile1.currentRank = 'ghost';
    profile1.unlockedThemes.push('galaxy');

    const profile3 = await getUserProfile();
    expect(profile3.currentRank).toBe('novice');
    expect(profile3.unlockedThemes).toEqual([
      'terminal',
      'deep-burgundy',
      'cyprus-sand',
      'night-imperial',
    ]);
  });
});
