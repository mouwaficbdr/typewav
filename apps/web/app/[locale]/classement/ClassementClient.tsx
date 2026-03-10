'use client';

/**
 * ClassementClient — page de classement hebdomadaire.
 *
 * Phase 3 : classement local basé sur IndexedDB.
 * Les sessions de la semaine courante sont transformées en LeaderboardEntry
 * en utilisant le pseudo de l'utilisateur (depuis UserProfile).
 *
 * Phase 4 ajoutera Supabase pour un classement global.
 *
 * Spec : docs/specs/08 — Leaderboards contextuels
 * 'use client' justifié : IndexedDB, state React, filtres
 */

import { LeaderboardTable } from '@/components/social/LeaderboardTable';
import { getSessions, getUserProfile } from '@/lib/db';
import type { LeaderboardEntry, SessionResult } from '@typewav/types';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type FilterMode = 'all' | 'classic' | 'sprint' | 'endurance' | 'code';

function getISOWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

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
    week: getISOWeek(new Date(session.timestamp)),
  };
}

export function ClassementClient() {
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

  const currentWeek = useMemo(() => getISOWeek(new Date()), []);

  const entries = useMemo<LeaderboardEntry[]>(() => {
    return sessions
      .filter((s) => {
        const week = getISOWeek(new Date(s.timestamp));
        if (week !== currentWeek) return false;
        if (modeFilter !== 'all' && s.mode !== modeFilter) return false;
        return true;
      })
      .map((s) => sessionToEntry(s, pseudo));
  }, [sessions, pseudo, modeFilter, currentWeek]);

  const filterButtons: { label: string; value: FilterMode }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'Classique', value: 'classic' },
    { label: 'Sprint', value: 'sprint' },
    { label: 'Endurance', value: 'endurance' },
    { label: 'Code', value: 'code' },
  ];

  return (
    <main className="flex min-h-dvh flex-col items-center gap-8 p-8 max-w-3xl mx-auto w-full">
      <header className="w-full">
        <Link
          href="/profil"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ← Profil
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-primary)',
            fontSize: '2rem',
            fontWeight: 300,
            letterSpacing: '0.1em',
          }}
        >
          Classement
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
            marginTop: '0.25rem',
          }}
        >
          Semaine {currentWeek} · Vos sessions de cette semaine
        </p>
      </header>

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
          Chargement…
        </p>
      ) : (
        <div className="w-full">
          <LeaderboardTable entries={entries} currentUserPseudo={pseudo} />
        </div>
      )}
    </main>
  );
}
