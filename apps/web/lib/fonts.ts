import {
  Cormorant_Garamond,
  Courier_Prime,
  Fraunces,
  JetBrains_Mono,
  Sora,
} from 'next/font/google';

/**
 * Polices Google chargées via next/font.
 * display: 'optional' — zéro layout shift (FOIT/FOUT évités).
 * Spec : docs/ARCHITECTURE.md — Tailwind CSS 4.0
 */
export const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-display',
  display: 'swap',
});

export const fontUi = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

/** Wordmark uniquement (`NavLogo`) : moitié "type", texture machine à écrire. */
export const fontLogoMono = Courier_Prime({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-logo-mono',
  display: 'swap',
});

/** Wordmark uniquement (`NavLogo`) : moitié "wav", élégance musicale. */
export const fontLogoSerif = Fraunces({
  subsets: ['latin'],
  weight: ['500'],
  style: ['italic'],
  variable: '--font-logo-serif',
  display: 'swap',
});
