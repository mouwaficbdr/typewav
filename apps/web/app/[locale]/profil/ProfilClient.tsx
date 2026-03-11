'use client';

/**
 * ProfilClient — dashboard profil principal.
 *
 * Client Component justifié : IndexedDB, Recharts interactif, Zustand.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Profil & analytics
 * Spec : docs/specs/31-pages-refonte.md — FORGE [3] design direction
 */

import { ContributionHeatmap } from '@/components/charts/ContributionHeatmap';
import { WpmProgressChart } from '@/components/charts/WpmProgressChart';
import { useUser } from '@/hooks/useUser';
import { getPersonalRecords, getSessions, getUserProfile } from '@/lib/db';
import { SYNC_IS_COMING_SOON } from '@/lib/featureFlags';
import { useProgressionStore } from '@/stores/useProgressionStore';
import type { PersonalRecords, RankTier, SessionResult } from '@typewav/types';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type ChartDays = 7 | 30 | 90;

export function ProfilClient() {
  const { setProfile, setPersonalRecords, setRank } = useProgressionStore();
  const { isPremium } = useUser();
  const tSync = useTranslations('sync');
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tRanks = useTranslations('ranks');
  const locale = useLocale();

  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [records, setRecords] = useState<PersonalRecords | null>(null);
  const [rank, setLocalRank] = useState<RankTier>('novice');
  const [pseudo, setPseudo] = useState('');
  const [chartDays, setChartDays] = useState<ChartDays>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allSessions, profile, personalRecords] = await Promise.all([
        getSessions(),
        getUserProfile(),
        getPersonalRecords(),
      ]);

      setSessions(allSessions);
      setRecords(personalRecords);
      setLocalRank(profile.currentRank);
      setPseudo(profile.pseudo);

      // Synchroniser le store global
      setProfile(profile);
      setRank(profile.currentRank);
      if (personalRecords) setPersonalRecords(personalRecords);

      setLoading(false);
    }
    void load();
  }, [setProfile, setPersonalRecords, setRank]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: 'calc(100dvh - 48px)',
          background: 'var(--color-bg)',
          padding: '48px 24px',
          maxWidth: 860,
          margin: '0 auto',
        }}
      >
        {/* Stats skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 96, borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
        {/* Chart skeleton */}
        <div
          className="skeleton"
          style={{
            height: 200,
            marginBottom: 40,
            borderRadius: 'var(--radius-lg)',
          }}
        />
        {/* Heatmap skeleton */}
        <div
          className="skeleton"
          style={{ height: 120, borderRadius: 'var(--radius-lg)' }}
        />
      </main>
    );
  }

  const totalSessions = sessions.length;
  const avgWpm =
    totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.wpm, 0) / totalSessions)
      : 0;
  const avgAccuracy =
    totalSessions > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalSessions,
        )
      : 0;

  const recentReplays = sessions.slice(0, 5);

  return (
    <main
      style={{
        minHeight: 'calc(100dvh - 48px)',
        background: 'var(--color-bg)',
        padding: '48px 24px',
        maxWidth: 860,
        margin: '0 auto',
      }}
    >
      {/* Banner sync coming soon — visible uniquement pour les utilisateurs Premium */}
      {isPremium && SYNC_IS_COMING_SOON && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '24px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            lineHeight: '1.6',
          }}
        >
          {tSync('premiumBanner')}
        </div>
      )}

      {/* En-tête — rang + WPM médian + pseudo */}
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '2rem',
            color: 'var(--color-text-primary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {tRanks(rank)} · {avgWpm} WPM MÉDIAN
        </p>
        {pseudo && (
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              marginTop: 4,
            }}
          >
            {pseudo}
          </p>
        )}
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            color: 'var(--color-text-muted)',
            fontSize: 14,
            marginTop: 4,
          }}
        >
          {tProfile('sessionCount', { count: totalSessions })}
        </p>
      </div>

      {/* Stats résumé — grille 2×2 flottante, zéro bordure */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px 48px',
          marginBottom: 40,
        }}
      >
        {[
          { label: tProfile('avgWpm'), value: avgWpm, unit: 'WPM' },
          { label: tProfile('avgAccuracy'), value: avgAccuracy, unit: '%' },
          {
            label: tProfile('recordWpm'),
            value: records?.maxWpm.value ?? 0,
            unit: 'WPM',
          },
          {
            label: tProfile('recordAccuracy'),
            value: Math.round(records?.maxAccuracy.value ?? 0),
            unit: '%',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <span
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-ui)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {stat.label}
            </span>
            <span
              style={{
                color: 'var(--color-accent)',
                fontSize: '2rem',
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {stat.value}
              {stat.unit && (
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    marginLeft: 4,
                  }}
                >
                  {stat.unit}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Graphe WPM */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {tProfile('wpmProgress')}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {([7, 30, 90] as ChartDays[]).map((d) => (
              <button
                key={d}
                onClick={() => setChartDays(d)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${chartDays === d ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background:
                    chartDays === d
                      ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                      : 'transparent',
                  color:
                    chartDays === d
                      ? 'var(--color-accent)'
                      : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {tProfile('daysFilter', { count: d })}
              </button>
            ))}
          </div>
        </div>
        <WpmProgressChart sessions={sessions} days={chartDays} />
      </section>

      {/* Heatmap */}
      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--color-text-primary)',
            marginBottom: 16,
          }}
        >
          {tProfile('activity90Days')}
        </h2>
        <ContributionHeatmap sessions={sessions} />
      </section>

      {/* Replays récents */}
      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {tProfile('recentReplays')}
        </h2>
        {recentReplays.length === 0 ? (
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {tProfile('noReplays')}
          </p>
        ) : (
          recentReplays.map((session) => (
            <div
              key={session.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom:
                  '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  color: 'var(--color-accent)',
                }}
              >
                {session.wpm} WPM
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {session.accuracy.toFixed(0)}% · {session.mode}
                {session.collectionId ? ` · ${session.collectionId}` : ''}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {new Date(session.timestamp).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <Link
                href={`/${locale}/replay?id=${session.id}`}
                aria-label={tProfile('openReplay')}
                style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}
              >
                |◄
              </Link>
            </div>
          ))
        )}
      </section>

      {/* Lien retour */}
      <Link
        href="/"
        className="transition-colors duration-150 hover:text-[var(--color-text-primary)] hover:underline"
        style={{
          display: 'inline-block',
          padding: '10px 24px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          textDecoration: 'none',
          transition: 'border-color 0.15s, color 0.15s',
        }}
      >
        {tCommon('backToTyping')}
      </Link>
    </main>
  );
}
