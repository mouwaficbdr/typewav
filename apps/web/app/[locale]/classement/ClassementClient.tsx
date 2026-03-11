'use client';

/**
 * ClassementClient — page de classement / meilleures sessions.
 *
 * Phase 3 : classement local basé sur IndexedDB.
 * Affiche les meilleures sessions personnelles (all-time), triées par WPM.
 * Phase 4 ajoutera Supabase pour un classement global (BIENTÔT).
 *
 * Spec : docs/specs/08 — Leaderboards contextuels
 * Spec : docs/specs/31-pages-refonte.md — FORGE [3] design direction
 * 'use client' justifié : IndexedDB, state React, filtres
 */

import { LeaderboardTable } from '@/components/social/LeaderboardTable';
import { getSessions, getUserProfile } from '@/lib/db';
import type { LeaderboardEntry, SessionResult } from '@typewav/types';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type FilterMode = 'all' | 'classic' | 'sprint' | 'endurance' | 'code';

function sessionToEntry(
  session: SessionResult,
  pseudo: string,
): LeaderboardEntry {
  return {
    pseudo: pseudo || 'Anonyme',
    wpm: session.wpm,
    accuracy: session.accuracy,
    achievedAt: session.timestamp,
    collectionId: session.collectionId ?? '',
    mode: session.mode,
    week: '',
  };
}

export function ClassementClient() {
  const t = useTranslations('leaderboard');
  const tCommon = useTranslations('common');

  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [pseudo, setPseudo] = useState('');
  const [modeFilter, setModeFilter] = useState<FilterMode>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allSessions, profile] = await Promise.all([
        getSessions(),
        getUserProfile(),
      ]);
      setSessions(allSessions);
      setPseudo(profile.pseudo);
      setLoading(false);
    }
    void load();
  }, []);

  const entries = useMemo<LeaderboardEntry[]>(() => {
    return sessions
      .filter((s) => {
        if (modeFilter !== 'all' && s.mode !== modeFilter) return false;
        return true;
      })
      .map((s) => sessionToEntry(s, pseudo))
      .sort((a, b) => b.wpm - a.wpm);
  }, [sessions, pseudo, modeFilter]);

  const filterButtons: { label: string; value: FilterMode }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'Classique', value: 'classic' },
    { label: 'Sprint', value: 'sprint' },
    { label: 'Endurance', value: 'endurance' },
    { label: 'Code', value: 'code' },
  ];

  return (
    <main
      className="flex flex-col items-center gap-8 p-8 max-w-3xl mx-auto w-full"
      style={{ minHeight: 'calc(100dvh - 48px)' }}
    >
      {/* Banner honnête — classement mondial bientôt */}
      <div
        data-testid="coming-soon-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
        }}
      >
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {t('comingSoonMessage')}
        </p>
        <span
          data-testid="soon-badge"
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {t('soon')}
        </span>
      </div>

      <header className="w-full">
        <Link
          href="/profil"
          className="transition-colors duration-150 hover:text-[var(--color-text-primary)] hover:underline"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            marginBottom: '1rem',
            display: 'inline-block',
            textDecoration: 'none',
          }}
        >
          ← Profil
        </Link>
      </header>

      {/* Titre section */}
      <h2
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 0,
          marginTop: 0,
          width: '100%',
        }}
      >
        {t('myBestSessions')}
      </h2>

      {/* Filtres par mode */}
      <div className="flex gap-2 flex-wrap w-full">
        {filterButtons.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setModeFilter(value)}
            style={{
              padding: '0.35rem 0.85rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              cursor: 'pointer',
              background:
                modeFilter === value ? 'var(--color-accent)' : 'transparent',
              color: modeFilter === value ? '#000' : 'var(--color-text-muted)',
              border: '1px solid',
              borderColor:
                modeFilter === value
                  ? 'var(--color-accent)'
                  : 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
          }}
        >
          {tCommon('loading')}
        </p>
      ) : (
        <div className="w-full">
          <LeaderboardTable entries={entries} currentUserPseudo={pseudo} />
        </div>
      )}
    </main>
  );
}
