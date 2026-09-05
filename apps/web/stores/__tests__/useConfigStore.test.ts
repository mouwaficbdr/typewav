import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPreference } from '@/lib/db';
import { DEFAULT_CONFIG, useConfigStore } from '../useConfigStore';

// Le storage IndexedDB est asynchrone : l'hydratation automatique déclenchée
// à la création du store (une seule fois, à l'import du module) peut se
// résoudre à un moment imprévisible par rapport au premier test. On force
// une réhydratation déterministe avant chaque test, sinon un test peut
// s'exécuter pendant qu'un set() d'hydratation en vol retombe hors d'act(),
// rendant le composant de test instable.
beforeEach(async () => {
  await act(async () => {
    await useConfigStore.persist.rehydrate();
  });
});

// Reset store state between tests to ensure isolation
afterEach(async () => {
  await act(async () => {
    useConfigStore.setState(DEFAULT_CONFIG);
  });
});

describe('useConfigStore', () => {
  it('état initial : mode classic, 60s, both langues', () => {
    const { result } = renderHook(() => useConfigStore());
    expect(result.current.activeMode).toBe('classic');
    expect(result.current.durationSeconds).toBe(60);
    expect(result.current.textLanguage).toBe('both');
  });

  it('setMode change le mode', async () => {
    const { result } = renderHook(() => useConfigStore());
    await act(async () => result.current.setMode('sprint'));
    expect(result.current.activeMode).toBe('sprint');
  });

  it('togglePunctuation bascule correctement', async () => {
    const { result } = renderHook(() => useConfigStore());
    await act(async () => result.current.togglePunctuation());
    expect(result.current.punctuationEnabled).toBe(true);
    await act(async () => result.current.togglePunctuation());
    expect(result.current.punctuationEnabled).toBe(false);
  });

  it('setCollection change la collection active', async () => {
    const { result } = renderHook(() => useConfigStore());
    await act(async () => result.current.setCollection('poesie'));
    expect(result.current.activeCollection).toBe('poesie');
  });

  it('setDuration change la durée', async () => {
    const { result } = renderHook(() => useConfigStore());
    await act(async () => result.current.setDuration(30));
    expect(result.current.durationSeconds).toBe(30);
  });

  it('toggleNumbers bascule correctement', async () => {
    const { result } = renderHook(() => useConfigStore());
    await act(async () => result.current.toggleNumbers());
    expect(result.current.numbersEnabled).toBe(true);
  });

  it('setTextLanguage change la langue', async () => {
    const { result } = renderHook(() => useConfigStore());
    await act(async () => result.current.setTextLanguage('fr'));
    expect(result.current.textLanguage).toBe('fr');
  });

  it('persiste via IndexedDB (getPreference), jamais via localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useConfigStore());

    await act(async () => result.current.setMode('sprint'));

    await waitFor(async () => {
      const stored = await getPreference<string>('typewav-config');
      expect(stored).toBeDefined();
      expect(stored).toContain('"activeMode":"sprint"');
    });

    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
