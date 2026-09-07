import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '../useMediaQuery';

function stub(initial: boolean) {
  const listeners = new Set<() => void>();
  let matches = initial;
  window.matchMedia = vi.fn().mockReturnValue({
    get matches() {
      return matches;
    },
    media: '(max-width: 900px)',
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  } as unknown as MediaQueryList);
  return { set: (v: boolean) => {
    matches = v;
    listeners.forEach((cb) => cb());
  } };
}

describe('useMediaQuery', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reflète et suit la media query', () => {
    const ctl = stub(false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 900px)'));
    expect(result.current).toBe(false);
    act(() => ctl.set(true));
    expect(result.current).toBe(true);
  });

  it('reste false sans matchMedia', () => {
    // @ts-expect-error suppression volontaire
    delete window.matchMedia;
    const { result } = renderHook(() => useMediaQuery('(max-width: 900px)'));
    expect(result.current).toBe(false);
  });
});
