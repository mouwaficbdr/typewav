import { decodeReplay } from '@/lib/replay';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ReplayClient } from './ReplayClient';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const t = await getTranslations({ locale: loc, namespace: 'replay' });

  let title = t('metaTitle');
  let description = t('metaDescription');

  // Carte de partage dynamique : le replay porte tout dans `?d=` (base64url).
  // Décodage best-effort, repli sur les meta génériques si le lien est
  // tronqué ou trafiqué.
  const raw = (await searchParams).d;
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const replay = decodeReplay(raw);
      title = t('ogTitle', {
        wpm: Math.round(replay.wpm),
        accuracy: Math.round(replay.accuracy),
      });
      description = t('ogDescription');
    } catch {
      // lien invalide : on garde les meta génériques
    }
  }

  return buildMetadata({ locale: loc, title, description });
}

export default function ReplayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center">
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Chargement du replay…
          </p>
        </main>
      }
    >
      <ReplayClient />
    </Suspense>
  );
}
