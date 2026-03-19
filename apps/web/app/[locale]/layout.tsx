import { MilestoneToast } from '@/components/progression/MilestoneToast';
import { GlobalNav } from '@/components/ui/GlobalNav';
import { routing } from '@/i18n/routing';
import { APP_URL, buildMetadata } from '@/lib/seo';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === 'en') {
    return buildMetadata({
      alternates: { canonical: `${APP_URL}/en` },
    });
  }
  return buildMetadata({
    title: 'Musicothérapie du clavier',
    description:
      'Tapez en musique. Chaque frappe correcte produit une note. Entraînement au typing avec une expérience audio immersive.',
    alternates: { canonical: APP_URL },
  });
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Valider la locale
  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <GlobalNav />
        {children}
        <MilestoneToast />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
