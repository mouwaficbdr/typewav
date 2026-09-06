import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ProfilClient } from './ProfilClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const t = await getTranslations({ locale: loc, namespace: 'profile' });
  return buildMetadata({
    locale: loc,
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

function ProfilLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: 14,
      }}
    >
      Chargement du profil…
    </div>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<ProfilLoadingFallback />}>
      <ProfilClient />
    </Suspense>
  );
}
