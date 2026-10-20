'use client';

import { Piano } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StartScreenProps {
  touchMode: boolean;
  onShare: () => void;
  onExplore: () => void;
  copied: boolean;
}

/** Écran 6 : à toi (spec partie B). */
export function StartScreen({
  touchMode,
  onShare,
  onExplore,
  copied,
}: StartScreenProps) {
  const t = useTranslations('intro');

  return (
    <div
      data-part="start-screen"
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
        {t('start.title')}
      </h2>
      <p
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <Piano size={16} aria-hidden="true" />
        {t('start.future')}
      </p>
      {touchMode ? (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            data-part="start-share"
            onClick={onShare}
            className="touch-manipulation hover:opacity-70 transition-opacity"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.95rem',
              color: 'var(--color-accent)',
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            {copied ? t('start.copied') : t('start.share')}
          </button>
          <button
            type="button"
            data-part="start-explore"
            onClick={onExplore}
            className="touch-manipulation hover:opacity-70 transition-opacity"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.95rem',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              padding: '10px 0',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            {t('start.explore')}
          </button>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('start.go')}
        </p>
      )}
    </div>
  );
}
