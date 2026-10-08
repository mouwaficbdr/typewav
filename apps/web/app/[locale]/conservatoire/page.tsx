import { ConservatoireClient } from '@/components/conservatoire/ConservatoireClient';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const t = await getTranslations({ locale: loc, namespace: 'conservatoire' });
  return buildMetadata({ locale: loc, title: t('metaTitle') });
}

export default function ConservatoirePage() {
  return <ConservatoireClient />;
}
