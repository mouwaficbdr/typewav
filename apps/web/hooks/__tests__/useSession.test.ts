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

// Mock progression check : fonction hissée pour pouvoir l'importer et
// asserter sur ses appels (trackProgress: false doit la laisser intacte).
const mockRunAfterSession = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);
vi.mock('@/hooks/useProgressionCheck', () => ({
  useProgressionCheck: () => ({
    runAfterSession: mockRunAfterSession,
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

const mockAudioStore = { themeId: 'terminal' };

vi.mock('@/stores/useAudioStore', () => ({
  useAudioStore: () => mockAudioStore,
}));

import { saveSession } from '@/lib/db';
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

  /**
   * Monte le hook avec une séance en cours (endedAt null), puis fait
   * transiter endedAt : c'est le vrai signal « la séance vient de finir ».
   */
  async function endSessionAndWait() {
    const { rerender } = renderHook(() =>
      useSession({ text: 'hello world', autoNavigate: true }),
    );
    act(() => {
      mockSessionStore.endedAt = (mockSessionStore.startedAt ?? 0) + 30_000;
    });
    rerender();
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalled());
    const pushedUrl = mockPush.mock.calls[0]?.[0] as string;
    return new URLSearchParams(pushedUrl.split('?')[1]);
  }

  it('inclut wpmNet dans les params URL en fin de session avec erreurs', async () => {
    const start = Date.now() - 30_000;
    mockSessionStore.startedAt = start;
    mockSessionStore.keystrokes = [
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

    const urlParams = await endSessionAndWait();

    expect(urlParams.has('wpmNet')).toBe(true);
    expect(urlParams.has('wpm')).toBe(true);
    const wpm = Number(urlParams.get('wpm'));
    const wpmNet = Number(urlParams.get('wpmNet'));
    expect(wpmNet).toBeLessThanOrEqual(wpm);
  });

  it('inclut wpmNet ≈ wpm si aucune erreur commise (session parfaite)', async () => {
    const start = Date.now() - 30_000;
    mockSessionStore.startedAt = start;
    mockSessionStore.keystrokes = Array.from({ length: 60 }, (_, i) => ({
      char: 'a',
      timestamp: start + i * 500,
      correct: true,
      deltaMs: 500,
    }));

    const urlParams = await endSessionAndWait();

    const wpm = Number(urlParams.get('wpm'));
    const wpmNet = Number(urlParams.get('wpmNet'));
    expect(wpmNet).toBe(wpm);
  });

  it('ne re-navigue PAS vers /results si on monte avec une séance déjà terminée (retour depuis /results via « Encore »)', async () => {
    const start = Date.now() - 30_000;
    mockSessionStore.startedAt = start;
    mockSessionStore.endedAt = start + 30_000; // séance périmée déjà dans le store au montage
    mockSessionStore.keystrokes = Array.from({ length: 40 }, (_, i) => ({
      char: 'a',
      timestamp: start + i * 500,
      correct: true,
      deltaMs: 500,
    }));

    renderHook(() => useSession({ text: 'hello world', autoNavigate: true }));

    // Laisser tous les effets + microtâches se dérouler.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('useSession : trackProgress false (Zen)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = null;
    mockSessionStore.endedAt = null;
  });

  it("ne sauvegarde ni ne compte la session pour la progression malgré une fin de session normale", async () => {
    const start = Date.now() - 30_000;
    mockSessionStore.startedAt = start;
    mockSessionStore.keystrokes = Array.from({ length: 40 }, (_, i) => ({
      char: 'a',
      timestamp: start + i * 500,
      correct: true,
      deltaMs: 500,
    }));

    renderHook(() =>
      useSession({
        text: 'hello world',
        autoNavigate: false,
        trackProgress: false,
      }),
    );
    act(() => {
      mockSessionStore.endedAt = (mockSessionStore.startedAt ?? 0) + 30_000;
    });

    // Laisser tous les effets + microtâches se dérouler : rien à attendre
    // (ni push ni saveSession), donc un délai fixe plutôt qu'un waitFor.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(saveSession).not.toHaveBeenCalled();
    expect(mockRunAfterSession).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('sauvegarde et compte bien la session quand trackProgress est omis (comportement par défaut inchangé)', async () => {
    const start = Date.now() - 30_000;
    mockSessionStore.startedAt = start;
    mockSessionStore.keystrokes = Array.from({ length: 40 }, (_, i) => ({
      char: 'a',
      timestamp: start + i * 500,
      correct: true,
      deltaMs: 500,
    }));

    renderHook(() => useSession({ text: 'hello world', autoNavigate: false }));
    act(() => {
      mockSessionStore.endedAt = (mockSessionStore.startedAt ?? 0) + 30_000;
    });

    await vi.waitFor(() => expect(saveSession).toHaveBeenCalled());
    await vi.waitFor(() => expect(mockRunAfterSession).toHaveBeenCalled());
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

describe('useSession — live stats interval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = null;
    mockSessionStore.endedAt = null;
  });

  it('met à jour le WPM live après 1s même si des frappes arrivent plus vite que le tick', () => {
    vi.useFakeTimers();
    const start = Date.now();
    mockSessionStore.startedAt = start;

    const { result, rerender } = renderHook(() =>
      useSession({ text: 'hello world', autoNavigate: false }),
    );

    // Frappes toutes les 100ms — largement plus rapide que le tick d'1s.
    for (let i = 1; i <= 5; i++) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
      mockSessionStore.keystrokes = [
        ...mockSessionStore.keystrokes,
        { char: 'a', timestamp: start + i * 100, correct: true, deltaMs: 100 },
      ];
      rerender();
    }

    act(() => {
      vi.advanceTimersByTime(600); // total écoulé : 1100ms
    });

    expect(result.current.liveStats.wpm).toBeGreaterThan(0);

    vi.useRealTimers();
  });
});

describe('useSession — changement de thème audio en cours de session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = null;
    mockSessionStore.endedAt = null;
    mockAudioStore.themeId = 'terminal';
  });

  it("ne redémarre pas la session quand le thème audio change en cours de frappe", () => {
    const { rerender } = renderHook(() =>
      useSession({ text: 'hello world', autoNavigate: false }),
    );

    expect(mockSessionStore.startSession).toHaveBeenCalledTimes(1);

    // Changement de thème audio en pleine frappe — ne doit pas redémarrer.
    mockAudioStore.themeId = 'nightclub';
    rerender();

    expect(mockSessionStore.startSession).toHaveBeenCalledTimes(1);
  });

  it('redémarre bien la session quand le texte change (nouveau test)', () => {
    const { rerender } = renderHook(
      ({ text }) => useSession({ text, autoNavigate: false }),
      { initialProps: { text: 'hello world' } },
    );

    expect(mockSessionStore.startSession).toHaveBeenCalledTimes(1);

    rerender({ text: 'a whole new text' });

    expect(mockSessionStore.startSession).toHaveBeenCalledTimes(2);
  });
});

describe('useSession — finalStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = null;
    mockSessionStore.endedAt = null;
  });

  it("expose un wpm final correct dès la fin de session, même si le tick périodique (1s) n'a jamais eu le temps de se déclencher", () => {
    // Session très courte : 10 frappes correctes en 300ms — bien en dessous
    // du délai de 1s du tick périodique de liveStats.
    const start = Date.now();
    const keystrokes = Array.from({ length: 10 }, (_, i) => ({
      char: 'a',
      timestamp: start + i * 30,
      correct: true,
      deltaMs: 30,
    }));

    mockSessionStore.startedAt = start;
    mockSessionStore.keystrokes = keystrokes;

    const { result, rerender } = renderHook(() =>
      useSession({ text: 'hello world', autoNavigate: false }),
    );

    // liveStats n'a jamais été mis à jour (aucun tick périodique déclenché) —
    // il reste à sa valeur initiale.
    expect(result.current.liveStats.wpm).toBe(0);

    // La session se termine 300ms après le début.
    mockSessionStore.endedAt = start + 300;
    rerender();

    expect(result.current.finalStats).not.toBeNull();
    expect(result.current.finalStats?.wpm).toBeGreaterThan(0);
  });
});

describe('useSession — duration timeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = Date.now();
    mockSessionStore.endedAt = null;
  });

  it('termine automatiquement la session en mode classic quand la durée est atteinte', () => {
    vi.useFakeTimers();

    renderHook(() =>
      useSession({ text: 'hello world', mode: 'classic', durationSeconds: 1 }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSessionStore.endSession).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('useSession — compte à rebours (audit configbar, décision 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStore.position = 0;
    mockSessionStore.keystrokes = [];
    mockSessionStore.startedAt = null;
    mockSessionStore.endedAt = null;
  });

  it("expose la durée complète tant que la séance n'a pas commencé", async () => {
    const { result } = renderHook(() =>
      useSession({ text: 'hello', mode: 'classic', durationSeconds: 30 }),
    );

    // La valeur passe par une microtâche (pas de setState synchrone dans le
    // corps de l'effet, voir react-hooks/set-state-in-effect).
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.secondsRemaining).toBe(30);
  });

  it('ticke chaque seconde une fois la séance démarrée, jusqu’à 0', () => {
    vi.useFakeTimers();
    mockSessionStore.startedAt = Date.now();

    const { result } = renderHook(() =>
      useSession({ text: 'hello', mode: 'classic', durationSeconds: 3 }),
    );

    // Premier tick sur un setTimeout(0) plutôt que dans le corps de l'effet.
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current.secondsRemaining).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsRemaining).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsRemaining).toBe(0);

    vi.useRealTimers();
  });

  it('reste à null hors des modes chronométrés (ex: sprint)', async () => {
    mockSessionStore.startedAt = Date.now();
    const { result } = renderHook(() =>
      useSession({ text: 'hello', mode: 'sprint', durationSeconds: 30 }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.secondsRemaining).toBeNull();
  });
});
