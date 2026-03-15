import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'fr' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  Sampler: vi.fn().mockImplementation(() => ({
    triggerAttackRelease: vi.fn(),
    toDestination: vi.fn().mockReturnThis(),
  })),
  now: vi.fn().mockReturnValue(0),
  Reverb: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    connect: vi.fn().mockReturnThis(),
  })),
}));

// Mock DB — évite les appels à IndexedDB
vi.mock('@/lib/db', () => ({
  saveSession: vi.fn().mockResolvedValue('test-session-id'),
}));

// Mock progression check
vi.mock('@/hooks/useProgressionCheck', () => ({
  useProgressionCheck: () => ({
    runAfterSession: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock stores Zustand
const mockMoveBack = vi.fn();
const mockSessionStore = {
  position: 0,
  keystrokes: [] as import('@typewav/types').KeystrokeEntry[],
  startedAt: null as number | null,
  endedAt: null as number | null,
  soundPackId: 'piano',
  themeId: 'terminal',
  startSession: vi.fn(),
  recordKeystroke: vi.fn(),
  moveBack: mockMoveBack,
  endSession: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: () => mockSessionStore,
}));

vi.mock('@/stores/useAudioStore', () => ({
  useAudioStore: () => ({ themeId: 'terminal' }),
}));

import { useSession } from '../useSession';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSession — navigation vers /results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = null;
    mockSessionStore.endedAt = null;
  });

  it('inclut wpmNet dans les params URL en fin de session avec erreurs', async () => {
    const start = Date.now() - 30_000;

    // Simuler 50 frappes correctes + 10 incorrectes → wpmNet < wpm
    const keystrokes: import('@typewav/types').KeystrokeEntry[] = [
      ...Array.from({ length: 50 }, (_, i) => ({
        char: 'a',
        timestamp: start + i * 500,
        correct: true,
        deltaMs: 500,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        char: 'x',
        timestamp: start + 50 * 500 + i * 500,
        correct: false,
        deltaMs: 500,
      })),
    ];

    mockSessionStore.startedAt = start;
    mockSessionStore.endedAt = start + 30_000;
    mockSessionStore.keystrokes = keystrokes;

    renderHook(() => useSession({ text: 'hello world', autoNavigate: true }));

    // Attendre que saveSession soit appelé et la navigation se produise
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    const pushedUrl = mockPush.mock.calls[0]?.[0] as string;
    const urlParams = new URLSearchParams(pushedUrl.split('?')[1]);

    expect(urlParams.has('wpmNet')).toBe(true);
    expect(urlParams.has('wpm')).toBe(true);

    const wpm = Number(urlParams.get('wpm'));
    const wpmNet = Number(urlParams.get('wpmNet'));

    // wpmNet doit être inférieur à wpm quand des erreurs existent
    expect(wpmNet).toBeLessThanOrEqual(wpm);
  });

  it('inclut wpmNet ≈ wpm si aucune erreur commise (session parfaite)', async () => {
    const start = Date.now() - 30_000;

    const keystrokes: import('@typewav/types').KeystrokeEntry[] = Array.from(
      { length: 60 },
      (_, i) => ({
        char: 'a',
        timestamp: start + i * 500,
        correct: true,
        deltaMs: 500,
      }),
    );

    mockSessionStore.startedAt = start;
    mockSessionStore.endedAt = start + 30_000;
    mockSessionStore.keystrokes = keystrokes;

    renderHook(() => useSession({ text: 'hello world', autoNavigate: true }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    const pushedUrl = mockPush.mock.calls[0]?.[0] as string;
    const urlParams = new URLSearchParams(pushedUrl.split('?')[1]);

    const wpm = Number(urlParams.get('wpm'));
    const wpmNet = Number(urlParams.get('wpmNet'));

    // Session parfaite : wpmNet doit être égal à wpm
    expect(wpmNet).toBe(wpm);
  });
});

describe('useSession — handleBackspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = Date.now() - 5000;
    mockSessionStore.endedAt = null;
  });

  it('appelle moveBack sur le store si position > 0', () => {
    mockSessionStore.position = 2;

    const { result } = renderHook(() =>
      useSession({ text: 'hello', autoNavigate: false }),
    );

    act(() => {
      result.current.handleBackspace();
    });

    expect(mockMoveBack).toHaveBeenCalledOnce();
  });

  it('ne fait rien si position === 0', () => {
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];

    const { result } = renderHook(() =>
      useSession({ text: 'hello', autoNavigate: false }),
    );

    act(() => {
      result.current.handleBackspace();
    });

    expect(mockMoveBack).not.toHaveBeenCalled();
  });

  it('autorise Backspace si des frappes existent', () => {
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [
      { char: 'x', timestamp: Date.now(), correct: false, deltaMs: 0 },
    ];

    const { result } = renderHook(() =>
      useSession({ text: 'hello', autoNavigate: false }),
    );

    act(() => {
      result.current.handleBackspace();
    });

    expect(mockMoveBack).toHaveBeenCalledOnce();
  });

  it('ne fait rien si la session est terminée', () => {
    mockSessionStore.position = 2;
    mockSessionStore.endedAt = Date.now();

    const { result } = renderHook(() =>
      useSession({ text: 'hello', autoNavigate: false }),
    );

    act(() => {
      result.current.handleBackspace();
    });

    expect(mockMoveBack).not.toHaveBeenCalled();
  });
});
