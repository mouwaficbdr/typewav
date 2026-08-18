'use client';

/**
 * DevOnboardingClient : rejoue le tutoriel d'onboarding à chaque montage,
 * isolé du reste de l'app, ne lit ni n'écrit jamais le flag
 * hasCompletedOnboarding (apps/web/lib/onboarding.ts).
 *
 * Existe pour itérer sur l'onboarding sans devoir passer par le flux complet
 * de l'app (ConfigBar, sélection de texte, etc.) à chaque rechargement.
 * Voir apps/web/app/[locale]/dev-onboarding/page.tsx pour le garde IS_DEV_MODE.
 */

import { LearningMode } from '@/components/modes/LearningMode';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export function DevOnboardingClient() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        minHeight: '100dvh',
        padding: '32px',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        /dev-onboarding : rejoue le tutoriel à chaque rechargement, isolé du
        reste de l&apos;app.
      </p>
      <LearningMode
        isOnboarding
        onExitTutorial={() => router.push(`/${locale}`)}
      />
    </main>
  );
}
