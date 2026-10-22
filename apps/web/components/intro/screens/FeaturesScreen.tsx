'use client';

import { Keyboard, Play, Swords, UserCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentType } from 'react';

export const FEATURE_KEYS = [
  'modes',
  'pieces',
  'replay',
  'progress',
  'challenge',
] as const;

interface FeaturesScreenProps {
  activeIndex: number;
  showRest: boolean;
  onSelect: (index: number) => void;
}

/** Écran 4 : ce qui t'attend (spec partie B). Des envies, pas un mode d'emploi. */
export function FeaturesScreen({
  activeIndex,
  showRest,
  onSelect,
}: FeaturesScreenProps) {
  const t = useTranslations('intro');

  if (showRest) {
    return (
      <div data-part="features-screen">
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: '1.1rem',
            color: 'var(--color-text-primary)',
          }}
        >
          {t('features.rest')}
        </p>
      </div>
    );
  }

  const key = FEATURE_KEYS[activeIndex] ?? FEATURE_KEYS[0];

  return (
    <div
      data-part="features-screen"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: 'clamp(2.4rem, 6vw, 3.6rem)',
          color: 'var(--color-accent)',
        }}
      >
        {t(`features.${key}.title`)}
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
        }}
      >
        {t(`features.${key}.line`)}
      </p>
      <div style={{ display: 'flex', gap: '14px' }}>
        {FEATURE_KEYS.map((k, i) => {
          const Icon = FEATURE_ICON[k];
          return (
            <button
              key={k}
              type="button"
              data-part={`feature-${k}`}
              data-active={i === activeIndex}
              onClick={() => onSelect(i)}
              aria-label={t(`features.${k}.title`)}
              className="touch-manipulation hover:opacity-70 transition-opacity"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // 44px, cible tactile minimale (WCAG 2.5.5, Apple HIG), pas
                // 36px : ces boutons se tapent en plein milieu du parcours,
                // à chaque session tactile.
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'none',
                cursor: 'pointer',
                pointerEvents: 'auto',
                color:
                  i === activeIndex
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
              }}
            >
              {Icon ? <Icon size={16} /> : <span aria-hidden="true">♪</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const FEATURE_ICON: Record<(typeof FEATURE_KEYS)[number], ComponentType<{ size?: number }> | null> =
  {
    modes: Keyboard,
    pieces: null,
    replay: Play,
    progress: UserCircle,
    challenge: Swords,
  };
