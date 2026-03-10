import { fontDisplay, fontMono, fontUi } from '@/lib/fonts';
import '@/styles/globals.css';

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
