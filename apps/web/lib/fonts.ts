import { Cormorant_Garamond, JetBrains_Mono, Sora } from 'next/font/google';

/**
 * Polices Google chargées via next/font.
 * display: 'optional' — zéro layout shift (FOIT/FOUT évités).
 * Spec : docs/ARCHITECTURE.md — Tailwind CSS 4.0
 */
export const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-display',
  display: 'optional',
});

export const fontUi = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-ui',
  display: 'optional',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'optional',
});
