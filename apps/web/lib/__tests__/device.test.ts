import { afterEach, describe, expect, it, vi } from 'vitest';
import { NON_DESKTOP_MEDIA_QUERY, isNonDesktopDevice } from '../device';

// Projet web-lib = environnement node : `window` n'existe pas par défaut, ce
// qui couvre directement le cas SSR. On stube un `window` minimal pour les
// autres branches puis on nettoie.
const originalWindow = (globalThis as { window?: unknown }).window;

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window?: unknown }).window = originalWindow;
  }
  vi.restoreAllMocks();
});

function stubMatchMedia(matches: boolean) {
  const matchMedia = vi.fn((query: string) => ({ matches, media: query }));
  (globalThis as { window?: unknown }).window = { matchMedia };
  return matchMedia;
}

describe('isNonDesktopDevice', () => {
  it('false quand window est absent (SSR) : fail-safe vers desktop', () => {
    expect((globalThis as { window?: unknown }).window).toBeUndefined();
    expect(isNonDesktopDevice()).toBe(false);
  });

  it('false quand matchMedia est absent', () => {
    (globalThis as { window?: unknown }).window = {};
    expect(isNonDesktopDevice()).toBe(false);
  });

  it('true quand la requête appareil non desktop matche', () => {
    const matchMedia = stubMatchMedia(true);
    expect(isNonDesktopDevice()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith(NON_DESKTOP_MEDIA_QUERY);
  });

  it('false quand la requête ne matche pas (desktop)', () => {
    stubMatchMedia(false);
    expect(isNonDesktopDevice()).toBe(false);
  });
});
