'use client';

/**
 * Le Conservatoire (spec partie 2, « Entrée ») : l'onboarding à la première
 * visite, puis l'espace. En attendant les parties 3 et 4 (cycle 1, accueil,
 * séance du jour), l'espace affiche le mode Apprentissage actuel.
 */

import { LearningMode } from '@/components/modes/LearningMode';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { isNonDesktopDevice } from '@/lib/device';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import { Stage } from './Stage';

type View = 'loading' | 'mobile' | 'onboarding' | 'space';

export function ConservatoireClient() {
  const t = useTranslations('conservatoire');
  const router = useRouter();
  const locale = useLocale();
  const { loadMidiPiece } = useAudioEngine();
  const [view, setView] = useState<View>('loading');
  const [unsaved, setUnsaved] = useState(false);

  // Le placement et le mode Apprentissage jouent le morceau par défaut : sans
  // HomeClient dans cet arbre, personne d'autre ne le charge.
  useEffect(() => {
    void loadMidiPiece('fur-elise');
  }, [loadMidiPiece]);

  useEffect(() => {
    let cancelled = false;
    if (isNonDesktopDevice()) {
      queueMicrotask(() => {
        if (!cancelled) setView('mobile');
      });
    } else {
      hasCompletedOnboarding()
        .then((done) => {
          if (!cancelled) setView(done ? 'space' : 'onboarding');
        })
        .catch(() => {
          // Drapeau illisible : l'onboarding reste jouable, en mémoire, avec
          // une ligne honnête sur l'enregistrement impossible.
          if (cancelled) return;
          setUnsaved(true);
          setView('onboarding');
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const goHome = () => router.push(`/${locale}`);

  return (
    <main
      style={{
        height: 'calc(100dvh - var(--nav-height))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 32px 32px',
        overflow: 'hidden',
      }}
    >
      {unsaved && view !== 'mobile' && (
        <p
          role="note"
          style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-text-muted)' }}
        >
          {t('unsaved')}
        </p>
      )}
      {view === 'mobile' && <Stage title={t('mobile')} />}
      {view === 'onboarding' && (
        <div style={{ flex: '1 1 0%', minHeight: 0, width: '100%' }}>
          <OnboardingFlow onComplete={() => setView('space')} onSkip={goHome} />
        </div>
      )}
      {view === 'space' && (
        <div style={{ flex: '1 1 0%', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
          <LearningMode onExitTutorial={goHome} />
        </div>
      )}
    </main>
  );
}
