import { MilestoneToast } from '@/components/progression/MilestoneToast';
import { GlobalNav } from '@/components/ui/GlobalNav';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'TypeWav — Immersive Musical Typing',
  description:
    'TypeWav est un outil de typing immersif et musical. Chaque frappe produit une note. Chaque séance devient une composition.',
  keywords: ['typing', 'music', 'wpm', 'monkeytype', 'open source'],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Valider la locale
  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <GlobalNav />
      {children}
      <MilestoneToast />
    </NextIntlClientProvider>
  );
}
