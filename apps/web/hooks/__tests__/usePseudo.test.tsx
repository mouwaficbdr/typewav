import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockGetUserProfile = vi.fn();
vi.mock('@/lib/db', () => ({
  getUserProfile: () => mockGetUserProfile(),
}));

import { usePseudo } from '../usePseudo';

describe('usePseudo', () => {
  it('lit le pseudo du profil IndexedDB', async () => {
    mockGetUserProfile.mockResolvedValue({ pseudo: 'Alice' });
    const { result } = renderHook(() => usePseudo());
    expect(result.current).toBe('');
    await waitFor(() => expect(result.current).toBe('Alice'));
  });

  it('reste vide si IndexedDB est indisponible', async () => {
    mockGetUserProfile.mockRejectedValue(new Error('no idb'));
    const { result } = renderHook(() => usePseudo());
    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());
    expect(result.current).toBe('');
  });
});
