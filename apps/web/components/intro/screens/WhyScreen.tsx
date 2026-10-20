'use client';

import { useTranslations } from 'next-intl';

/** Écran 3 : pourquoi (spec partie B). */
export function WhyScreen() {
  const t = useTranslations('intro');

  return (
    <div
      data-part="why-screen"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: 'clamp(2.6rem, 6.5vw, 4.2rem)',
          lineHeight: 1.1,
          color: 'var(--color-text-primary)',
        }}
      >
        {t('why.title')}
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
        }}
      >
        {t('why.line')}
      </p>
    </div>
  );
}
