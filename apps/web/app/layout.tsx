import { fontDisplay, fontMono, fontUi } from '@/lib/fonts';
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
 * Root layout — Server Component.
 * next-intl injecte un nested layout [locale] qui ajoute
 * NextIntlClientProvider. Ce layout ne pose que les balises HTML fondamentales.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${fontDisplay.variable} ${fontUi.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
