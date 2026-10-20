'use client';

import { useTranslations } from 'next-intl';

const TERMS = ['private', 'clear', 'other', 'backup'] as const;

interface DataScreenProps {
  expanded: boolean;
}

/** Écran 5 : tes données (spec partie B). */
export function DataScreen({ expanded }: DataScreenProps) {
  const t = useTranslations('intro');

  return (
    <div
      data-part="data-screen"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: 'clamp(2.6rem, 6.5vw, 4.2rem)',
          color: 'var(--color-text-primary)',
        }}
      >
        {t('data.title')}
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
        }}
      >
        {t('data.line')}
      </p>
      {expanded && (
        <dl
          data-part="data-detail"
          style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}
        >
          {TERMS.map((term) => (
            <div key={term} style={{ display: 'flex', gap: '12px' }}>
              <dt
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-primary)',
                  flexShrink: 0,
                }}
              >
                {t(`data.${term}.term`)}
              </dt>
              <dd
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.92rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {t(`data.${term}.def`)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
