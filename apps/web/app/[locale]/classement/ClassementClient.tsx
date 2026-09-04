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
    <main className="min-h-screen text-[var(--color-text-primary)] pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-12 md:pt-24 flex flex-col gap-10">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-6">
          <p className="font-mono text-xs md:text-sm text-[var(--color-accent)] uppercase tracking-[0.5em]">
            {t('title')}
          </p>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.85] tracking-tighter uppercase text-[var(--color-text-primary)]">
            ARCHIVE
          </h1>
          <p className="font-ui text-sm text-[var(--color-text-muted)] max-w-xl mt-2">
            {t('subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div 
          role="group" 
          aria-label={t('filterAll')} 
          className="flex flex-wrap gap-2 w-full"
        >
          {filterButtons.map(({ label, value }) => {
            const active = modeFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setModeFilter(value)}
                aria-pressed={active}
                className={`
                  px-3 py-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-widest border transition-all duration-200
                  ${active 
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)] border-[var(--color-text-primary)]' 
                    : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* List Section */}
        <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-20 border-t border-[var(--color-border)]">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] animate-pulse">
                {tCommon('loading')}
              </p>
            </div>
          ) : (
            <LeaderboardTable entries={entries} />
          )}
        </div>
      </div>
    </main>
  );
}

