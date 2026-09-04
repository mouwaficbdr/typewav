import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetPreference = vi.fn();
const mockSetPreference = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  getPreference: (key: string) => mockGetPreference(key),
  setPreference: (key: string, value: unknown) =>
    mockSetPreference(key, value),
}));

import { useKeyboardLayoutPreference } from '../useKeyboardLayoutPreference';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPreference.mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useKeyboardLayoutPreference', () => {
  it('retombe sur qwerty tant que rien n’est stocké', async () => {
    const { result } = renderHook(() => useKeyboardLayoutPreference());
    expect(result.current.layout).toBe('qwerty');
    await waitFor(() => expect(mockGetPreference).toHaveBeenCalledWith('keyboardLayout'));
  });

  it('charge la disposition déjà stockée au montage', async () => {
    mockGetPreference.mockResolvedValue('azerty');
    const { result } = renderHook(() => useKeyboardLayoutPreference());
    await waitFor(() => expect(result.current.layout).toBe('azerty'));
  });

  it('setLayout met à jour immédiatement et persiste en arrière-plan', async () => {
    const { result } = renderHook(() => useKeyboardLayoutPreference());
    await waitFor(() => expect(mockGetPreference).toHaveBeenCalled());

    act(() => {
      result.current.setLayout('azerty');
    });

    expect(result.current.layout).toBe('azerty');
    await waitFor(() =>
      expect(mockSetPreference).toHaveBeenCalledWith('keyboardLayout', 'azerty'),
    );
  });
});
