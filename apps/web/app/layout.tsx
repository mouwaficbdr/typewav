import { buildMetadata } from '@/lib/seo';
import '@/styles/globals.css';
import type { Viewport } from 'next';

export const metadata = buildMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

/**
 * Root layout : pass-through.
 *
 * Les balises `<html>` / `<body>` vivent dans `app/[locale]/layout.tsx` : c'est
 * le seul endroit qui connaît la locale, indispensable pour `<html lang>`. Ce
 * layout racine ne sert qu'à porter `metadata` / `viewport` par défaut et à
 * exister comme ancêtre du segment `[locale]` (structure next-intl sans
 * `next/root-params`, indisponible avant Next 16.3).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
