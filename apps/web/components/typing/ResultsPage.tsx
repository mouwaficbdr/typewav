'use client';

/**
 * ResultsPage — affichage des résultats après un test de typing.
 *
 * Client Component justifié : animation Motion, interaction (rejouer).
 * Spec : docs/specs/02-diagnostic.md, docs/specs/25-results-page-enhancement.md
 */

import { motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

interface ResultsPageProps {
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
  recommendation: string;
  sessionId?: string;
  isNewWpmRecord?: boolean;
  isNewAccuracyRecord?: boolean;
}

function StatCard({
  label,
  value,
  unit,
  delay,
  isRecord,
}: {
  label: string;
  value: number;
  unit: string;
  delay: number;
  isRecord?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.4;

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay: shouldReduceMotion ? 0 : delay }}
      className="flex flex-col items-center gap-1 p-6"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        minWidth: '140px',
      }}
    >
      {/* 1. Label */}
      <span
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      {/* 2. Valeur */}
      <span
        style={{
          color: isRecord ? 'var(--color-accent)' : 'var(--color-text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '2.5rem',
          fontWeight: '600',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: '1',
        }}
      >
        {Math.round(value)}
      </span>
      {/* 3. Unité */}
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        {unit}
      </span>
    </motion.div>
  );
}

export function ResultsPage({
  wpm,
  wpmNet,
  accuracy,
  consistency,
  recommendation,
  isNewWpmRecord,
  isNewAccuracyRecord,
}: ResultsPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.5;
  const t = useTranslations('results');
  const tProfile = useTranslations('profile');
  const locale = useLocale();

  const hasRecord = (isNewWpmRecord ?? false) || (isNewAccuracyRecord ?? false);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
          fontSize: '2.5rem',
          fontWeight: '300',
          letterSpacing: '0.05em',
        }}
      >
        {t('title')}
      </motion.h1>

      {/* Bannière record personnel */}
      {hasRecord && (
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.4,
            delay: shouldReduceMotion ? 0 : 0.05,
          }}
          style={{
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 24px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--color-accent)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
          aria-live="polite"
          role="status"
        >
          ✦ {t('newRecord')}
        </motion.div>
      )}

      {/* Métriques principales */}
      <div className="flex flex-wrap gap-4 justify-center">
        <StatCard
          label={t('wpmGross')}
          value={wpm}
          unit="mots/min"
          delay={0.1}
          {...(isNewWpmRecord !== undefined
            ? { isRecord: isNewWpmRecord }
            : {})}
        />
        <StatCard
          label={t('wpmNet')}
          value={wpmNet}
          unit="mots/min"
          delay={0.2}
        />
        <StatCard
          label={t('accuracy')}
          value={accuracy}
          unit="%"
          delay={0.3}
          {...(isNewAccuracyRecord !== undefined
            ? { isRecord: isNewAccuracyRecord }
            : {})}
        />
        <StatCard
          label={t('consistency')}
          value={consistency}
          unit="%"
          delay={0.4}
        />
      </div>

      {/* Recommandation */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration, delay: shouldReduceMotion ? 0 : 0.6 }}
          className="max-w-lg p-6 text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            {t('diagnosis')}
          </p>
          <p
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.9375rem',
              lineHeight: '1.6',
            }}
          >
            {recommendation}
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration, delay: shouldReduceMotion ? 0 : 0.8 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        <Link
          href="/"
          style={{
            backgroundColor: 'var(--color-accent)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-ui)',
            fontWeight: '600',
            letterSpacing: '0.05em',
            padding: '10px 24px',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          {t('tryAgain')}
        </Link>
        <Link
          href={`/${locale}/profil`}
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            padding: '10px 24px',
            textDecoration: 'none',
          }}
        >
          {tProfile('title')}
        </Link>
      </motion.div>
    </main>
  );
}
