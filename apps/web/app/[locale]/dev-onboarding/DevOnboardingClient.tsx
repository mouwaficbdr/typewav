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
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function DevOnboardingClient() {
  const router = useRouter();
  const locale = useLocale();

  // Sans HomeClient dans cet arbre, personne n'appelle loadMidiPiece : le
  // séquenceur n'a aucune pièce, advanceAndGetNote() renvoie null et chaque
  // frappe est silencieuse. On charge la pièce par défaut, comme HomeClient.
  const { loadMidiPiece } = useAudioEngine();
  useEffect(() => {
    void loadMidiPiece('fur-elise');
  }, [loadMidiPiece]);

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        // height (pas seulement minHeight) : LearningMode chaîne des
        // height:100% / flex:1 jusqu'au schéma clavier ; sans hauteur
        // définie ici, toute la chaîne retombe sur la hauteur du contenu et
        // le clavier se réduit à sa taille intrinsèque par défaut.
        // On soustrait la hauteur de nav (ce <main> est rendu sous la nav
        // globale, comme dans HomeClient) : 100dvh brut débordait de toute
        // la hauteur de nav et faisait scroller la page.
        height: 'calc(100dvh - var(--nav-height))',
        padding: '32px',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          flexShrink: 0,
        }}
      >
        /dev-onboarding : rejoue le tutoriel à chaque rechargement, isolé du
        reste de l&apos;app.
      </p>
      <div
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <LearningMode
          isOnboarding
          onExitTutorial={() => router.push(`/${locale}`)}
        />
      </div>
    </main>
  );
}
