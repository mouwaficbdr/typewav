'use client';

/**
 * ClassementClient : vos meilleures séances (local, IndexedDB).
 *
 * v1 : pas de comptes ni de sync cloud (retirés en PR #32). Cette page liste
 * vos sessions les plus rapides sur cet appareil, triées par WPM, filtrables
 * par mode. Rien de « mondial » ni de « bientôt » : ce qui est là est ce qu'il
 * y aura.
 *
 * Spec : docs/specs/08 (Leaderboards contextuels), docs/specs/31-pages-refonte.md
 * 'use client' justifié : IndexedDB, state React, filtres
 */

import { LeaderboardTable } from '@/components/social/LeaderboardTable';
import { getSessions, getUserProfile } from '@/lib/db';
import type { LeaderboardEntry, SessionResult } from '@typewav/types';
import { useTranslations } from 'next-intl';
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
      .filter((s) => modeFilter === 'all' || s.mode === modeFilter)
      .map((s) => sessionToEntry(s, pseudo))
      .sort((a, b) => b.wpm - a.wpm);
  }, [sessions, pseudo, modeFilter]);

  const filterButtons: { label: string; value: FilterMode }[] = [
    { label: t('filters.all'), value: 'all' },
    { label: t('filters.classic'), value: 'classic' },
    { label: t('filters.sprint'), value: 'sprint' },
    { label: t('filters.endurance'), value: 'endurance' },
    { label: t('filters.code'), value: 'code' },
  ];

  return (
    <main
      className="flex flex-col items-start gap-7 max-w-3xl mx-auto w-full"
      style={{
        minHeight: 'calc(100dvh - var(--nav-height))',
        padding: 'clamp(28px, 6vh, 64px) 24px',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            margin: 0,
            color: 'var(--color-text-primary)',
          }}
        >
          {t('myBestSessions')}
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.95rem',
            margin: '10px 0 0',
          }}
        >
          {t('subtitle')}
        </p>
      </div>

      <div
        role="group"
        aria-label={t('filterAll')}
        className="flex gap-2 flex-wrap w-full"
      >
        {filterButtons.map(({ label, value }) => {
          const active = modeFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setModeFilter(value)}
              aria-pressed={active}
              style={{
                padding: '0.4rem 0.9rem',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                cursor: 'pointer',
                background: active ? 'var(--color-accent)' : 'transparent',
                color: active ? 'var(--color-bg)' : 'var(--color-text-muted)',
                border: '1px solid',
                borderColor: active
                  ? 'var(--color-accent)'
                  : 'var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {loading ? (
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              padding: '2rem 0',
            }}
          >
            {tCommon('loading')}
          </p>
        ) : (
          <LeaderboardTable entries={entries} />
        )}
      </div>
    </main>
  );
}
