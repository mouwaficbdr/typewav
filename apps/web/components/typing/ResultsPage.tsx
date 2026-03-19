'use client';

/**
 * ResultsPage — affichage des résultats, layout 2 colonnes.
 *
 * Colonne gauche : stats primaires (wpm / wpmNet / accuracy) + métadonnées mode
 * Colonne droite : WpmChart + stats secondaires + barre d'actions 4 icônes + CTA login
 *
 * Client Component justifié : useUser, interactions (relisten, share).
 * Spec : docs/specs/30-results-refonte.md (absorbe spec-25)
 */

import { WpmChart } from '@/components/typing/WpmChart';
import { useUser } from '@/hooks/useUser';
import { getSessionById } from '@/lib/db';
import { generateReplayLink } from '@/lib/replay';
import { calculateWpmPoints, type WpmPoint } from '@/lib/stats';
import type { NoteEvent, SessionResult, TypingMode } from '@typewav/types';
import { motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ResultsPageProps {
  // ── Métriques core ────────────────────────────────────────────────────────
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
  /** Durée totale en ms */
  durationMs: number;
  // ── Session metadata ──────────────────────────────────────────────────────
  mode: TypingMode;
  collectionId?: string;
  sessionId?: string;
  // ── Waveform ─────────────────────────────────────────────────────────────
  noteEvents?: NoteEvent[];
  // ── Records ──────────────────────────────────────────────────────────────
  isNewWpmRecord?: boolean;
  isNewAccuracyRecord?: boolean;
}

/**
 * StatPrimary — stat principale (label → grande valeur → microlabel record).
 * Ordre label → valeur requis par spec-25.
 */
function StatPrimary({
  label,
  value,
  isRecord,
  t,
}: {
  label: string;
  value: number;
  isRecord?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: '2.5rem',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {Math.round(value)}
        {isRecord && (
          <span
            role="status"
            aria-label={t('newRecord')}
            style={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: '100%',
              height: 1,
              backgroundColor: 'var(--color-accent)',
            }}
          />
        )}
      </span>
      {isRecord && (
        <span
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.625rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {t('record')}
        </span>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function ActionBtn({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        color: disabled ? 'var(--color-border)' : 'var(--color-text-muted)',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem',
        padding: '6px 12px',
        transition: 'color 0.1s, border-color 0.1s',
      }}
    >
      {icon}
    </button>
  );
}

export function ResultsPage({
  wpm,
  wpmNet,
  accuracy,
  consistency,
  durationMs,
  mode,
  collectionId,
  sessionId,
  noteEvents,
  isNewWpmRecord,
  isNewAccuracyRecord,
}: ResultsPageProps) {
  const t = useTranslations('results');
  const locale = useLocale();
  const { user } = useUser();
  const shouldReduceMotion = useReducedMotion();
  const animDur = shouldReduceMotion ? 0 : 0.4;

  const [wpmPoints, setWpmPoints] = useState<WpmPoint[]>([]);
  const [sessionForReplay, setSessionForReplay] =
    useState<SessionResult | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    void getSessionById(sessionId).then((session) => {
      if (!session) return;
      if (session.keystrokeData.length > 1) {
        setWpmPoints(calculateWpmPoints(session.keystrokeData));
      }
      setSessionForReplay(session);
    });
  }, [sessionId]);

  const handleShare = () => {
    if (!sessionId || !sessionForReplay?.text) return;
    const replayData = {
      sessionId,
      text: sessionForReplay.text,
      keystrokeTimings: sessionForReplay.keystrokeData.map((k) => k.deltaMs),
      wpm,
      accuracy,
      theme: sessionForReplay.themeId,
      soundPack: sessionForReplay.soundPackId,
      achievedAt: sessionForReplay.timestamp,
    };
    const relativePath = generateReplayLink(replayData);
    const url = `${window.location.origin}/${locale}${relativePath}`;
    void navigator.clipboard.writeText(url).catch(() => null);
  };

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 48,
        padding: '48px 24px',
        minHeight: 'calc(100dvh - 48px)',
        backgroundColor: 'var(--color-bg)',
        flexWrap: 'wrap',
      }}
    >
      {/* ── Colonne gauche : stats primaires ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: animDur }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          minWidth: 140,
        }}
      >
        <StatPrimary
          label={t('wpm')}
          value={wpm}
          {...(isNewWpmRecord !== undefined
            ? { isRecord: isNewWpmRecord }
            : {})}
          t={t}
        />
        <StatPrimary label={t('wpmNet')} value={wpmNet} t={t} />
        <StatPrimary
          label={t('accuracy')}
          value={accuracy}
          {...(isNewAccuracyRecord !== undefined
            ? { isRecord: isNewAccuracyRecord }
            : {})}
          t={t}
        />

        {/* Métadonnées mode · collection */}
        <div
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.03em',
          }}
        >
          {mode}
          {collectionId ? ` · ${collectionId}` : ''}
        </div>
      </motion.div>

      {/* ── Zone centrale : graphique + stats + actions ───────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: animDur, delay: shouldReduceMotion ? 0 : 0.1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flex: 1,
          minWidth: 280,
          maxWidth: 600,
        }}
      >
        {/* WpmChart */}
        <WpmChart
          points={wpmPoints}
          noteEvents={noteEvents ?? []}
          durationMs={durationMs}
        />

        {/* Stats secondaires */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {consistency}%
            </span>{' '}
            {t('consistency')}
          </span>
          <span aria-hidden="true" style={{ color: 'var(--color-border)' }}>
            |
          </span>
          <span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {formatDuration(durationMs)}
            </span>{' '}
            {t('duration')}
          </span>
        </div>

        {/* Barre d'actions — 4 icônes */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href={`/${locale}`}
            aria-label={t('nextTest')}
            title={t('nextTest')}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              padding: '6px 12px',
              textDecoration: 'none',
              transition: 'color 0.1s',
            }}
          >
            &gt;
          </Link>
          <Link
            href={`/${locale}`}
            aria-label={t('repeatTest')}
            title={t('repeatTest')}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              padding: '6px 12px',
              textDecoration: 'none',
              transition: 'color 0.1s',
            }}
          >
            ↺
          </Link>
          <ActionBtn
            icon="♪"
            label={t('relisten')}
            disabled={!noteEvents || noteEvents.length === 0}
          />
          <ActionBtn
            icon="|◄"
            label={t('shareReplay')}
            disabled={!sessionId}
            onClick={handleShare}
          />
        </div>

        {/* CTA connexion (si non connecté) */}
        {!user && (
          <Link
            href={`/${locale}/auth/login`}
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              textDecoration: 'none',
              letterSpacing: '0.03em',
              opacity: 0.7,
            }}
          >
            {t('loginCta')}
          </Link>
        )}
      </motion.div>
    </main>
  );
}
