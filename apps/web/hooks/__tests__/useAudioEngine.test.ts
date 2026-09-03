import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

interface MockReverb {
  wet: { rampTo: ReturnType<typeof vi.fn> };
  dispose: ReturnType<typeof vi.fn>;
  toDestination: () => MockReverb;
}
interface MockVoice {
  volume: { value: number; rampTo: ReturnType<typeof vi.fn> };
  triggerAttackRelease: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  connect: () => MockVoice;
  toDestination?: () => MockVoice;
}

let reverbInstances: MockReverb[] = [];
let samplerInstances: MockVoice[] = [];
let synthInstances: MockVoice[] = [];
const samplerConstructor = vi.fn();

vi.mock('tone', () => {
  class Reverb implements MockReverb {
    wet = { rampTo: vi.fn() };
    dispose = vi.fn();
    toDestination() {
      return this;
    }
    constructor() {
      reverbInstances.push(this);
    }
  }

  class Sampler implements MockVoice {
    volume = { value: 0, rampTo: vi.fn() };
    triggerAttackRelease = vi.fn();
    dispose = vi.fn();
    connect() {
      return this;
    }
    constructor(opts: { onload?: () => void }) {
      samplerConstructor(opts);
      samplerInstances.push(this);
      queueMicrotask(() => opts.onload?.());
    }
  }

  class Synth implements MockVoice {
    volume = { value: 0, rampTo: vi.fn() };
    triggerAttackRelease = vi.fn();
    dispose = vi.fn();
    connect() {
      return this;
    }
    toDestination() {
      return this;
    }
    constructor() {
      synthInstances.push(this);
    }
  }

  return {
    start: vi.fn().mockResolvedValue(undefined),
    now: vi.fn().mockReturnValue(0),
    getContext: vi.fn().mockReturnValue({
      lookAhead: 0.1,
      state: 'running',
      rawContext: { state: 'running' },
    }),
    Frequency: vi.fn().mockReturnValue({ toNote: () => 'C4' }),
    Sampler: vi.fn(function (this: unknown, opts: { onload?: () => void }) {
      return new Sampler(opts);
    }),
    Synth: vi.fn(function (this: unknown) {
      return new Synth();
    }),
    Reverb: vi.fn(function (this: unknown) {
      return new Reverb();
    }),
  };
});

vi.mock('@/lib/warp-engine', () => ({
  warpEngine: {
    reset: vi.fn(),
    onKeystroke: vi.fn(),
    getNoteDuration: vi.fn().mockReturnValue('8n'),
    getCurrentBpm: vi.fn().mockReturnValue(150),
  },
}));

vi.mock('@/lib/midi-asset-loader', () => ({
  MidiAssetLoadError: class MidiAssetLoadError extends Error {
    code = 'MIDI_ASSET_ABORTED';
  },
  loadMidiPieceWithAssets: vi.fn(),
}));

vi.mock('@/lib/note-expression', () => ({
  applyTypingExpression: (note: string) => note,
}));

import { useAudioStore } from '@/stores/useAudioStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { loadPieceFromData } from '@typewav/audio-engine';
import { useAudioEngine } from '../useAudioEngine';

const TEST_PIECE = {
  id: 'test-piece',
  title: 'Test',
  composer: 'Test',
  year: 2000,
  bpmReference: 120,
  ppq: 480,
  totalDurationSec: 1,
  notes: [
    {
      pitch: 60,
      durationSec: 0.5,
      durationTicks: 240,
      startTick: 0,
      velocity: 96,
      isPhraseBoundary: false,
    },
  ],
};

const INITIAL_AUDIO_STATE = {
  initialized: false,
  soundPackId: 'piano',
  volume: 0.8,
  themeId: 'terminal' as const,
  loading: false,
  activePieceId: null,
  midiLoadError: null,
  isSamplerLoaded: false,
  samplerLoadError: null,
  liveBpm: 80,
};

beforeEach(() => {
  reverbInstances = [];
  samplerInstances = [];
  synthInstances = [];
  samplerConstructor.mockClear();
  vi.clearAllMocks();
  useAudioStore.setState(INITIAL_AUDIO_STATE);
  useSessionStore.getState().reset();
});

describe('useAudioEngine — triggerResume', () => {
  it('ramène le reverb au wet de base du rang, jamais à zéro, avec un pic au-dessus', async () => {
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.initialize();
    });
    await waitFor(() => expect(samplerInstances.length).toBe(1));

    const reverb = reverbInstances[0]!;
    // initialize() réaligne déjà le wet sur le rang courant (applyRankProfile) :
    // on repart d'une ardoise propre pour n'observer que triggerResume.
    reverb.wet.rampTo.mockClear();

    await act(async () => {
      await result.current.triggerResume();
    });

    const rampCalls = reverb.wet.rampTo.mock.calls;
    expect(rampCalls).toHaveLength(2);

    const peakWet = rampCalls[0]![0] as number; // pic de correction
    const restWet = rampCalls[1]![0] as number; // retour au repos
    // Rang par défaut 'novice' : wet de base 0.25 (voir lib/rank-sound.ts).
    expect(restWet).toBe(0.25);
    expect(restWet).toBeGreaterThan(0); // jamais coupé pour le reste de la séance
    expect(peakWet).toBeGreaterThan(restWet); // un pic, pas un creux (vrai à tout rang)
    expect(peakWet).toBeLessThanOrEqual(0.9);

    unmount();
  });
});

describe('useAudioEngine — triggerSilence', () => {
  it('rejoue en écho doux la dernière note déjà jouée, jamais une nouvelle', async () => {
    loadPieceFromData(TEST_PIECE);
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.initialize();
    });
    await waitFor(() => expect(samplerInstances.length).toBe(1));

    await act(async () => {
      await result.current.playNote('a', 0);
    });

    const sampler = samplerInstances[0]!;
    const [firstNote, , , firstVelocity] =
      sampler.triggerAttackRelease.mock.calls[0]!;

    await act(async () => {
      await result.current.triggerSilence();
    });

    expect(sampler.triggerAttackRelease).toHaveBeenCalledTimes(2);
    const [echoNote, , , echoVelocity] =
      sampler.triggerAttackRelease.mock.calls[1]!;
    expect(echoNote).toBe(firstNote); // même hauteur, jamais une nouvelle note
    expect(echoVelocity).toBeLessThan(firstVelocity as number); // un écho, pas une vraie frappe

    unmount();
  });

  it("ne joue rien si aucune note n'a encore sonné", async () => {
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.initialize();
    });
    await waitFor(() => expect(samplerInstances.length).toBe(1));

    await act(async () => {
      await result.current.triggerSilence();
    });

    expect(samplerInstances[0]!.triggerAttackRelease).not.toHaveBeenCalled();

    unmount();
  });

  it("ne joue rien si l'audio n'est pas initialisé", async () => {
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.triggerSilence();
    });

    samplerInstances.forEach((sampler) => {
      expect(sampler.triggerAttackRelease).not.toHaveBeenCalled();
    });

    unmount();
  });
});

describe('useAudioEngine — playNote', () => {
  it('pousse le BPM live de warpEngine dans useAudioStore à chaque note', async () => {
    loadPieceFromData(TEST_PIECE);
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.initialize();
    });
    await waitFor(() => expect(samplerInstances.length).toBe(1));

    expect(useAudioStore.getState().liveBpm).toBe(80); // défaut, avant toute frappe

    await act(async () => {
      await result.current.playNote('a', 0);
    });

    expect(useAudioStore.getState().liveBpm).toBe(150); // warpEngine.getCurrentBpm() mocké

    unmount();
  });

  it('résout avec la note jouée et son indicateur de fin de phrase', async () => {
    loadPieceFromData(TEST_PIECE);
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.initialize();
    });
    await waitFor(() => expect(samplerInstances.length).toBe(1));

    let played: { note: string; isPhraseBoundary: boolean } | null = null;
    await act(async () => {
      played = await result.current.playNote('a', 0);
    });

    expect(played).not.toBeNull();
    expect(played!.isPhraseBoundary).toBe(false); // TEST_PIECE : note unique, non marquée

    unmount();
  });
});

describe('useAudioEngine — pas de double initialisation', () => {
  it('deux appels concurrents à initialize() ne construisent le graphe audio qu’une fois', async () => {
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await Promise.all([result.current.initialize(), result.current.initialize()]);
    });

    expect(samplerConstructor).toHaveBeenCalledTimes(1);
    expect(reverbInstances.length).toBe(1);
    expect(useAudioStore.getState().initialized).toBe(true);

    unmount();
  });

  it('deux instances distinctes du hook partagent le même graphe audio', async () => {
    loadPieceFromData(TEST_PIECE);
    const instanceA = renderHook(() => useAudioEngine());
    const instanceB = renderHook(() => useAudioEngine());

    await act(async () => {
      await Promise.all([
        instanceA.result.current.initialize(),
        instanceB.result.current.initialize(),
      ]);
    });

    expect(samplerConstructor).toHaveBeenCalledTimes(1);

    // La deuxième instance peut jouer une note bien qu'elle n'ait jamais
    // construit son propre sampler — la preuve que l'état est partagé.
    await act(async () => {
      await instanceB.result.current.playNote('a', 0);
    });
    expect(samplerInstances[0]!.triggerAttackRelease).toHaveBeenCalled();

    instanceA.unmount();
    instanceB.unmount();
  });
});

describe('useAudioEngine — cycle de vie partagé', () => {
  it("ne dispose le graphe audio que lorsque la dernière instance montée se démonte", async () => {
    const instanceA = renderHook(() => useAudioEngine());
    const instanceB = renderHook(() => useAudioEngine());

    await act(async () => {
      await instanceA.result.current.initialize();
    });
    await waitFor(() => expect(samplerInstances.length).toBe(1));

    instanceA.unmount();
    // instanceB est toujours montée : le moteur ne doit pas être disposé.
    expect(samplerInstances[0]!.dispose).not.toHaveBeenCalled();
    expect(useAudioStore.getState().initialized).toBe(true);

    instanceB.unmount();
    // Plus aucune instance montée : le moteur se ferme.
    expect(samplerInstances[0]!.dispose).toHaveBeenCalled();
    expect(useAudioStore.getState().initialized).toBe(false);
  });
});
