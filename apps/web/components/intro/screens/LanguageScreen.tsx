'use client';

import { Keycap } from '@/components/ui/Keycap';
import { useTranslations } from 'next-intl';
import type { IntroLanguage } from '../apply-exit';

interface LanguageScreenProps {
  language: IntroLanguage;
  status: 'idle' | 'tuning' | 'failed';
  onChoose: (lang: IntroLanguage) => void;
}

const OPTION_STYLE = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '10px',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
  fontWeight: 300,
} as const;

/** Écran 1 : le titre et la langue (spec partie B). */
export function LanguageScreen({ language, status, onChoose }: LanguageScreenProps) {
  const t = useTranslations('intro');

  return (
    <div
      data-part="language-screen"
      style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
        }}
      >
        {t('language.prompt')}
      </p>
      <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
        <button
          type="button"
          data-part="language-fr"
          data-testid="language-fr"
          data-selected={language === 'fr'}
          onClick={() => onChoose('fr')}
          style={{
            ...OPTION_STYLE,
            color:
              language === 'fr'
                ? 'var(--color-text-primary)'
                : 'var(--color-text-muted)',
          }}
        >
          Français <Keycap size="sm">F</Keycap>
        </button>
        <button
          type="button"
          data-part="language-en"
          data-testid="language-en"
          data-selected={language === 'en'}
          onClick={() => onChoose('en')}
          style={{
            ...OPTION_STYLE,
            color:
              language === 'en'
                ? 'var(--color-text-primary)'
                : 'var(--color-text-muted)',
          }}
        >
          English <Keycap size="sm">E</Keycap>
        </button>
      </div>
      <div
        data-part="equalizer"
        data-status={status}
        style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '20px' }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: '4px',
              height: status === 'tuning' ? `${8 + ((i * 7) % 12)}px` : '8px',
              background: 'var(--color-text-muted)',
              borderRadius: '2px',
              animation:
                status === 'tuning'
                  ? `intro-equalizer 900ms ease-in-out ${i * 120}ms infinite`
                  : 'none',
            }}
          />
        ))}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color:
            status === 'failed'
              ? 'var(--color-accent)'
              : 'var(--color-text-muted)',
        }}
      >
        {status === 'failed'
          ? t('language.soundFailed')
          : status === 'tuning'
            ? t('language.tuning')
            : t('language.sound')}
      </p>
      <style>{`
        @keyframes intro-equalizer {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
