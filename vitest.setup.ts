import '@testing-library/jest-dom';

// jsdom n'implémente pas matchMedia. Stub minimal (toujours "no match") pour
// que les composants qui lisent une media query (useIsMobile, ThemeQuickSwitcher)
// rendent sans crash. Les tests qui veulent l'autre branche l'écrasent
// localement.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
