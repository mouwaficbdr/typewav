'use client';

/**
 * AudioPreviewButton — bouton de démonstration audio sur la landing.
 * Client Component justifié : Tone.js browser-only, gestion de l'état.
 * Spec : docs/specs/21-audio-value-prop.md
 */

import { useAudioPreview } from '@/hooks/useAudioPreview';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

export function AudioPreviewButton() {
  const t = useTranslations('preview');
  const { playPreview, isPlaying, hasPlayed } = useAudioPreview();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={() => void playPreview()}
      disabled={isPlaying}
      aria-label={t('ariaLabel')}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'transparent',
        border: '1px solid var(--color-accent)',
        borderRadius: '6px',
        color: 'var(--color-accent)',
        cursor: isPlaying ? 'wait' : 'pointer',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        transition: 'opacity 0.15s',
        opacity: isPlaying ? 0.6 : 1,
      }}
      className="hover:opacity-80"
    >
      <span aria-hidden="true">{isPlaying ? '♪' : '▶'}</span>
      {hasPlayed ? t('replay') : t('play')}
    </motion.button>
  );
}
