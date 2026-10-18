import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ComingSoonClient } from '@/components/conservatoire/ComingSoonClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const t = await getTranslations({ locale: loc, namespace: 'comingSoon' });
  return buildMetadata({
    locale: loc,
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default function ConservatoirePage() {
  return <ComingSoonClient />;
}
