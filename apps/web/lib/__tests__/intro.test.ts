/**
 * Drapeau de l'Ouverture : `has_seen_intro_v1` dans `user_preferences`.
 * Lecture en échec : on ne piège jamais, l'Ouverture ne se montre pas.
 */
import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as db from '../db';
import { hasSeenIntro, INTRO_FLAG_KEY, markIntroSeen } from '../intro';

beforeEach(async () => {
  await deleteDB('typewav');
});
afterEach(async () => {
  await deleteDB('typewav');
  vi.restoreAllMocks();
});

describe('hasSeenIntro / markIntroSeen', () => {
  it('hasSeenIntro vaut false tant que le drapeau manque, true après markIntroSeen', async () => {
    expect(await hasSeenIntro()).toBe(false);
    await markIntroSeen();
    expect(await hasSeenIntro()).toBe(true);
  });

  it('hasSeenIntro vaut true si la lecture échoue (on ne piège jamais)', async () => {
    vi.spyOn(db, 'getPreference').mockRejectedValue(new Error('indexeddb down'));
    expect(await hasSeenIntro()).toBe(true);
  });

  it("markIntroSeen ne rejette pas si l'écriture échoue", async () => {
    vi.spyOn(db, 'setPreference').mockRejectedValue(new Error('indexeddb down'));
    await expect(markIntroSeen()).resolves.toBeUndefined();
  });

  it('pose le drapeau sous la bonne clé', async () => {
    await markIntroSeen();
    expect(await db.getPreference(INTRO_FLAG_KEY)).toBe(true);
  });
});
