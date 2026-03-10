'use client';

/**
 * ResultsPage — affichage des résultats après un test de typing.
 *
 * Client Component justifié : animation Motion, interaction (rejouer).
 * Spec : docs/specs/02-diagnostic.md
 */

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';

interface ResultsPageProps {
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
  recommendation: string;
  sessionId?: string;
}

function StatCard({
  label,
  value,
  unit,
  delay,
}: {
  label: string;
  value: number;
  unit: string;
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.4;

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay: shouldReduceMotion ? 0 : delay }}
      className="flex flex-col items-center gap-1 rounded-md p-6"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        minWidth: '140px',
      }}
    >
      <span
        style={{
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: '2.5rem',
          fontWeight: '600',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: '1',
        }}
      >
        {Math.round(value)}
      </span>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        {unit}
      </span>
      <span
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
        }}
      >
        {label}
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
}: ResultsPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.5;

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
        Résultats
      </motion.h1>

      {/* Métriques principales */}
      <div className="flex flex-wrap gap-4 justify-center">
        <StatCard label="WPM brut" value={wpm} unit="mots/min" delay={0.1} />
        <StatCard
          label="WPM net"
          value={wpmNet}
          unit="mots/min (corrigé)"
          delay={0.2}
        />
        <StatCard label="Précision" value={accuracy} unit="%" delay={0.3} />
        <StatCard label="Régularité" value={consistency} unit="%" delay={0.4} />
      </div>

      {/* Recommandation */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration, delay: shouldReduceMotion ? 0 : 0.6 }}
          className="max-w-lg rounded-md p-6 text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
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
            Recommandation
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
        className="flex gap-4"
      >
        <Link
          href="/"
          className="rounded-sm px-6 py-3 text-sm transition-opacity hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-ui)',
            fontWeight: '600',
            letterSpacing: '0.05em',
            textDecoration: 'none',
          }}
        >
          Rejouer
        </Link>
      </motion.div>
    </main>
  );
}
