/**
 * Local-first : la DB demande le stockage persistant à son ouverture
 * (exempte l'origine de l'éviction). Best effort, silencieux.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('persistance du stockage', () => {
  it("demande navigator.storage.persist() à l'ouverture de la DB", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persist } });

    const { getSessions } = await import('../db');
    await getSessions();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("ne redemande pas persist sur les accès suivants", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persist } });

    const { getSessions } = await import('../db');
    await getSessions();
    await getSessions();
    await getSessions();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("n'échoue pas si navigator.storage est indisponible", async () => {
    vi.stubGlobal('navigator', {});

    const { getSessions } = await import('../db');
    await expect(getSessions()).resolves.toBeInstanceOf(Array);
  });

  it("n'échoue pas si persist() rejette", async () => {
    const persist = vi.fn().mockRejectedValue(new Error('refusé'));
    vi.stubGlobal('navigator', { storage: { persist } });

    const { getSessions } = await import('../db');
    await expect(getSessions()).resolves.toBeInstanceOf(Array);
  });
});
