import { decodeChallenge } from '@/lib/challenge';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ChallengeClient } from './ChallengeClient';

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
  const t = await getTranslations({ locale: loc, namespace: 'challenge' });

  let title = t('metaTitle');
  let description = t('metaDescription');

  // Carte de partage dynamique : le lien de défi porte tout dans `?c=`
  // (base64url). Décodage best-effort : un lien tronqué ou trafiqué retombe
  // sur les meta génériques plutôt que de casser le rendu de la page.
  const raw = (await searchParams).c;
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const challenge = decodeChallenge(raw);
      const seconds = Math.max(1, Math.round(challenge.duration / 1000));
      title =
        typeof challenge.creatorWpm === 'number' &&
        Number.isFinite(challenge.creatorWpm)
          ? t('ogTitleScore', { wpm: Math.round(challenge.creatorWpm) })
          : t('ogTitleNoScore');
      description = t('ogDescription', { seconds });
    } catch {
      // lien invalide : on garde les meta génériques
    }
  }

  return buildMetadata({ locale: loc, title, description });
}

export default function ChallengePage() {
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
            Chargement du challenge…
          </p>
        </main>
      }
    >
      <ChallengeClient />
    </Suspense>
  );
}
