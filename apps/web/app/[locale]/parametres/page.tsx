import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ParametresClient } from './ParametresClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const t = await getTranslations({ locale: loc, namespace: 'settings' });
  return buildMetadata({ locale: loc, title: t('title') });
}

export default function ParametresPage() {
  return <ParametresClient />;
}
