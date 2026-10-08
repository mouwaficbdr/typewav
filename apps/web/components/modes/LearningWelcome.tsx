'use client';

/**
 * LearningWelcome : l'écran d'accueil du parcours Apprentissage, vu une seule
 * fois avant le niveau 1. Trois phrases : ce que fait TypeWav, ce qu'est ce
 * parcours, la règle note / silence / Retour arrière. Rien à toucher avant de
 * l'avoir lu : un débutant total comprend le principe avant la première touche.
 */

import { useTranslations } from 'next-intl';

export function LearningWelcome({ onStart }: { onStart: () => void }) {
  const t = useTranslations('learning.welcome');

  const sentence = {
    margin: 0,
    fontFamily: 'var(--font-ui)',
    fontSize: 16,
    lineHeight: 1.55,
    color: 'var(--color-text-primary)',
  } as const;

  return (
    <div
      className="flex flex-col items-center gap-4 w-full"
      style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-accent)',
          fontSize: 'clamp(1.6rem, 4vh, 2.2rem)',
          lineHeight: 1.15,
        }}
      >
        {t('title')}
      </h2>
      <p style={sentence}>{t('what')}</p>
      <p style={sentence}>{t('path')}</p>
      <p style={{ ...sentence, color: 'var(--color-accent)' }}>{t('rule')}</p>
      <button
        type="button"
        onClick={onStart}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
        style={{
          marginTop: 4,
          padding: '12px 32px',
          background: 'var(--color-accent)',
          color: '#000',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        {t('start')}
      </button>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          color: 'var(--color-text-muted)',
        }}
      >
        {t('layoutHint')}
      </p>
    </div>
  );
}
