import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pushSession, syncAll } from '../sync';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

// Mock IndexedDB db.ts
vi.mock('../db', () => ({
  getSessions: vi.fn(),
  getSessionById: vi.fn(),
  saveSession: vi.fn(),
}));

import { getSessionById, getSessions, saveSession } from '../db';

const mockSession = {
  id: 'session-1',
  timestamp: 1000,
  wpm: 75,
  wpmNet: 73,
  accuracy: 97,
  consistency: 88,
  duration: 60000,
  mode: 'classic' as const,
  themeId: 'terminal',
  soundPackId: 'piano',
  keystrokeData: [],
} satisfies import('@typewav/types').SessionResult;

function makeSupabaseMock(
  selectRows: { id?: string; raw_data?: unknown }[] = [],
  upsertError: null | { message: string } = null,
) {
  const upsertFn = vi.fn().mockResolvedValue({ error: upsertError });
  // eqResult est à la fois awaitable (thenable) ET chainable avec .in()
  // getCloudSessionIds fait `await .eq(...)` directement
  // pullFromCloud fait `await .eq(...).in(...)` — mais avec ce mock les 2 fonctionnent
  const inFn = vi.fn().mockResolvedValue({ data: [], error: null });
  const eqResult = Object.assign(
    Promise.resolve({ data: selectRows, error: null }),
    { in: inFn },
  );
  const eqFn = vi.fn().mockReturnValue(eqResult);
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });

  return {
    from: vi.fn().mockReturnValue({
      select: selectFn,
      upsert: upsertFn,
    }),
    _upsertFn: upsertFn,
  } as unknown as import('@supabase/supabase-js').SupabaseClient;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('syncAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne pushed=1, pulled=0 quand une session locale manque dans le cloud', async () => {
    // Supabase retourne 0 sessions existantes (cloud vide)
    vi.mocked(getSessions).mockResolvedValue([mockSession]);

    const supabase = makeSupabaseMock([]);
    const result = await syncAll(supabase, 'user-123');

    expect(result.pushed).toBe(1);
    expect(result.pulled).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('retourne pushed=0 si toutes les sessions locales sont déjà dans le cloud', async () => {
    vi.mocked(getSessions).mockResolvedValue([mockSession]);

    // Cloud a déjà cet ID
    const supabase = makeSupabaseMock([{ id: 'session-1' }]);
    const result = await syncAll(supabase, 'user-123');

    expect(result.pushed).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('retourne pulled=1 quand une session cloud manque en local', async () => {
    // Local : vide
    vi.mocked(getSessions).mockResolvedValue([]);
    vi.mocked(getSessionById).mockResolvedValue(undefined);
    vi.mocked(saveSession).mockResolvedValue('session-cloud-1');

    // Cloud a une session que le local n'a pas
    const cloudSession = {
      ...mockSession,
      id: 'session-cloud-1',
    } satisfies import('@typewav/types').SessionResult;

    // Premier select (ids) retourne la session cloud
    // Deuxième select (raw_data) retourne la session complète
    const inFn = vi.fn().mockResolvedValueOnce({
      data: [{ raw_data: cloudSession }],
      error: null,
    });
    const eqSelectFn = vi.fn().mockReturnValue({ in: inFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqSelectFn });

    // Pour le premier appel (IDs), eq retourne les IDs
    const eqIdsFn = vi.fn().mockResolvedValue({
      data: [{ id: 'session-cloud-1' }],
      error: null,
    });
    const selectIdsFn = vi.fn().mockReturnValue({ eq: eqIdsFn });

    let callCount = 0;
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1)
          return {
            select: selectIdsFn,
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        return {
          select: selectFn,
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    } as unknown as import('@supabase/supabase-js').SupabaseClient;

    const result = await syncAll(supabase, 'user-123');
    expect(result.pulled).toBe(1);
  });

  it('retourne errors=1 si une exception se produit', async () => {
    vi.mocked(getSessions).mockRejectedValue(new Error('IndexedDB failure'));

    const supabase = makeSupabaseMock([]);
    const result = await syncAll(supabase, 'user-123');

    expect(result.errors).toBe(1);
  });
});

describe('pushSession', () => {
  it('appelle upsert avec un row correctement formé', async () => {
    const upsertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({ upsert: upsertFn }),
    } as unknown as import('@supabase/supabase-js').SupabaseClient;

    await pushSession(supabase, 'user-abc', mockSession);

    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-1',
        user_id: 'user-abc',
        raw_data: mockSession,
      }),
      { onConflict: 'id' },
    );
  });
});
