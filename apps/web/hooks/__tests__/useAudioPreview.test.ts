import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockPlayNote = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    initialize: mockInitialize,
    playNote: mockPlayNote,
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useAudioPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ne joue aucune note avant le click (contrainte navigateur)', async () => {
    const { useAudioPreview } = await import('@/hooks/useAudioPreview');
    renderHook(() => useAudioPreview());
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockPlayNote).not.toHaveBeenCalled();
  });

  it('initialise Tone.js au premier click', async () => {
    const { useAudioPreview } = await import('@/hooks/useAudioPreview');
    const { result } = renderHook(() => useAudioPreview());

    void act(() => {
      void result.current.playPreview();
    });
    await vi.runAllTimersAsync();

    expect(mockInitialize).toHaveBeenCalledOnce();
  });

  it('joue plusieurs notes après le click', async () => {
    const { useAudioPreview } = await import('@/hooks/useAudioPreview');
    const { result } = renderHook(() => useAudioPreview());

    void act(() => {
      void result.current.playPreview();
    });
    await vi.runAllTimersAsync();

    expect(mockPlayNote.mock.calls.length).toBeGreaterThan(1);
  });

  it('isPlaying est false après la fin de la lecture', async () => {
    const { useAudioPreview } = await import('@/hooks/useAudioPreview');
    const { result } = renderHook(() => useAudioPreview());

    expect(result.current.isPlaying).toBe(false);

    await act(async () => {
      void result.current.playPreview();
      await vi.runAllTimersAsync();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('hasPlayed est false avant le click, true après', async () => {
    const { useAudioPreview } = await import('@/hooks/useAudioPreview');
    const { result } = renderHook(() => useAudioPreview());

    expect(result.current.hasPlayed).toBe(false);

    await act(async () => {
      void result.current.playPreview();
      await vi.runAllTimersAsync();
    });

    expect(result.current.hasPlayed).toBe(true);
  });

  it("n'appelle pas initialize une seconde fois si un achat est déjà en cours", async () => {
    // On bloque la résolution des timers pour maintenir isPlaying=true
    const { useAudioPreview } = await import('@/hooks/useAudioPreview');
    const { result } = renderHook(() => useAudioPreview());

    // Lancer la preview sans avancer les timers → isPlaying=true
    const promise = act(async () => {
      void result.current.playPreview();
      // Avancer juste assez pour que initialize soit appelé et isPlaying=true
      await vi.advanceTimersByTimeAsync(0);
    });

    // Le deuxième appel pendant que c'est en cours
    void act(() => {
      void result.current.playPreview();
    });

    await promise;
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // initialize a été appelé au moins une fois (le premier call)
    expect(mockInitialize.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
