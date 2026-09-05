import { MilestoneToast } from '@/components/progression/MilestoneToast';
import { GlobalNav } from '@/components/ui/GlobalNav';
import { routing } from '@/i18n/routing';
import {
  fontDisplay,
  fontLogoMono,
  fontLogoSerif,
  fontMono,
  fontUi,
} from '@/lib/fonts';
import { buildMetadata } from '@/lib/seo';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { ThemeScript } from '@/lib/theme/ThemeScript';
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === 'en') {
    return buildMetadata({ locale: 'en' });
  }
  return buildMetadata({
    locale: 'fr',
    title: 'Musicothérapie du clavier',
    description:
      'Tapez en musique. Chaque frappe correcte produit une note. Entraînement au typing avec une expérience audio immersive.',
  });
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Layout de locale : porte les balises `<html>` / `<body>`.
 *
 * C'est le seul endroit de l'arbre qui connaît la locale, donc le seul qui peut
 * poser `<html lang>`. Le layout racine (`app/layout.tsx`) n'est qu'un
 * pass-through au-dessus du segment `[locale]`.
 */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fontDisplay.variable} ${fontUi.variable} ${fontMono.variable} ${fontLogoMono.variable} ${fontLogoSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <GlobalNav />
            {children}
            <MilestoneToast />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
