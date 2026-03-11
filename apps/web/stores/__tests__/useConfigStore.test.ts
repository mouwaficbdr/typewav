import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../useConfigStore';

// Reset store state between tests to ensure isolation
afterEach(() => {
  useConfigStore.setState(DEFAULT_CONFIG);
  localStorage.clear();
});

describe('useConfigStore', () => {
  it('état initial : mode classic, 60s, both langues', () => {
    const { result } = renderHook(() => useConfigStore());
    expect(result.current.activeMode).toBe('classic');
    expect(result.current.durationSeconds).toBe(60);
    expect(result.current.textLanguage).toBe('both');
  });

  it('setMode change le mode', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.setMode('sprint'));
    expect(result.current.activeMode).toBe('sprint');
  });

  it('togglePunctuation bascule correctement', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.togglePunctuation());
    expect(result.current.punctuationEnabled).toBe(true);
    act(() => result.current.togglePunctuation());
    expect(result.current.punctuationEnabled).toBe(false);
  });

  it('setCollection change la collection active', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.setCollection('poesie'));
    expect(result.current.activeCollection).toBe('poesie');
  });

  it('setDuration change la durée', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.setDuration(30));
    expect(result.current.durationSeconds).toBe(30);
  });

  it('toggleNumbers bascule correctement', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.toggleNumbers());
    expect(result.current.numbersEnabled).toBe(true);
  });

  it('setTextLanguage change la langue', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.setTextLanguage('fr'));
    expect(result.current.textLanguage).toBe('fr');
  });
});
