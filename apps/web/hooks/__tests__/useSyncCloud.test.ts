import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Flag pilotable par test.
const mockFlags = vi.hoisted(() => ({ SYNC_IS_COMING_SOON: false }));
vi.mock('@/lib/featureFlags', () => ({
  get SYNC_IS_COMING_SOON() {
    return mockFlags.SYNC_IS_COMING_SOON;
  },
}));

vi.mock('@/lib/sync', () => ({
  syncAll: vi.fn().mockResolvedValue({ pushed: 0, pulled: 0, errors: 0 }),
}));

// Client Supabase toujours "présent" pour isoler l'effet du flag.
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({}),
}));

import { syncAll } from '@/lib/sync';
import { useSyncCloud } from '@/hooks/useSyncCloud';

describe('useSyncCloud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.SYNC_IS_COMING_SOON = false;
  });

  it('ne déclenche aucune sync (montage ni trigger manuel) tant que SYNC_IS_COMING_SOON est vrai', async () => {
    mockFlags.SYNC_IS_COMING_SOON = true;

    const { result } = renderHook(() => useSyncCloud('user-1', true));
    await Promise.resolve();

    expect(syncAll).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');

    await result.current.sync();
    expect(syncAll).not.toHaveBeenCalled();
  });

  it('déclenche la sync au montage pour un premium authentifié quand le flag est faux', async () => {
    mockFlags.SYNC_IS_COMING_SOON = false;

    renderHook(() => useSyncCloud('user-1', true));

    await waitFor(() => expect(syncAll).toHaveBeenCalledTimes(1));
  });
});
