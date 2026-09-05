import { beforeEach, describe, expect, it } from 'vitest';
import { useAudioStore } from '../useAudioStore';

beforeEach(() => {
  useAudioStore.setState({ liveBpm: 80 });
});

describe('useAudioStore : liveBpm', () => {
  it('démarre à 80 BPM, même défaut que warpEngine au repos', () => {
    expect(useAudioStore.getState().liveBpm).toBe(80);
  });

  it('setLiveBpm met à jour le tempo live', () => {
    useAudioStore.getState().setLiveBpm(140);
    expect(useAudioStore.getState().liveBpm).toBe(140);
  });
});
