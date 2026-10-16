'use client';

/**
 * Stage : la primitive « un écran, une chose » du Conservatoire (R1, R5).
 * Une phrase principale, une ligne d'appui au plus, un emplacement, la touche
 * à presser en pied d'écran, « Passer » en haut à droite si demandé. Chaque
 * nouvelle phrase entre en 240 ms (fondu et 8 px) ; l'emplacement fait de
 * même à chaque changement de `slotKey`, sans coupure sèche (R5). Chaque
 * écran est annoncé dans une région aria-live. Les parties portent
 * `data-part` (tests de rendu).
 */

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export const EASE_STRONG = [0.16, 1, 0.3, 1] as const;

export interface StageProps {
  title: string;
  support?: string;
  footer?: string;
  /** Texte lu par les lecteurs d'écran ; le titre par défaut. */
  announce?: string;
  onSkip?: () => void;
  children?: ReactNode;
  /**
   * Identité du contenu de l'emplacement (R5) : une transition douce joue à
   * chaque changement de valeur (une touche sèche, jamais une coupure
   * sèche) ; la même valeur entre deux rendus garde l'instance en place, par
   * exemple pour laisser une onde ou un clavier vivant survivre à plusieurs
   * écrans. Sans valeur, une seule identité stable (compatible, aucune
   * transition).
   */
  slotKey?: string;
}

export function Stage({ title, support, footer, announce, onSkip, children, slotKey }: StageProps) {
  const t = useTranslations('conservatoire');
  const reduceMotion = useReducedMotion() === true;

  return (
    <section
      data-stage
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '24px 16px',
        minHeight: 0,
      }}
    >
      {onSkip && (
        <button
          type="button"
          data-part="skip"
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '6px 12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {t('skip')}
        </button>
      )}

      <motion.div
        key={title}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: EASE_STRONG }}
        style={{ textAlign: 'center', maxWidth: 720 }}
      >
        <h1
          data-part="title"
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 'clamp(28px, 4vw, 44px)',
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        {support && (
          <p
            data-part="support"
            style={{ margin: '10px 0 0', fontFamily: 'var(--font-ui)', color: 'var(--color-text-muted)' }}
          >
            {support}
          </p>
        )}
      </motion.div>

      <AnimatePresence>
        {children !== undefined && (
          <motion.div
            key={slotKey ?? 'slot'}
            data-part="slot"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: EASE_STRONG }}
            style={{
              width: '100%',
              maxWidth: 880,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {footer && (
        <p
          data-part="footer"
          style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-muted)' }}
        >
          {footer}
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announce ?? title}
      </p>
    </section>
  );
}
