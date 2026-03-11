'use client';

/**
 * ProfilClient — dashboard profil principal.
 *
 * Client Component justifié : IndexedDB, Recharts interactif, Zustand.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Profil & analytics
 */

import { ContributionHeatmap } from '@/components/charts/ContributionHeatmap';
import { WpmProgressChart } from '@/components/charts/WpmProgressChart';
import { RankBadge } from '@/components/progression/RankBadge';
import { useUser } from '@/hooks/useUser';
import { getPersonalRecords, getSessions, getUserProfile } from '@/lib/db';
import { SYNC_IS_COMING_SOON } from '@/lib/featureFlags';
import { useProgressionStore } from '@/stores/useProgressionStore';
import type { PersonalRecords, RankTier, SessionResult } from '@typewav/types';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type ChartDays = 7 | 30 | 90;

export function ProfilClient() {
  const { setProfile, setPersonalRecords, setRank } = useProgressionStore();
  const { isPremium } = useUser();
  const tSync = useTranslations('sync');
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [records, setRecords] = useState<PersonalRecords | null>(null);
  const [rank, setLocalRank] = useState<RankTier>('novice');
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {tCommon('loading')}
      </div>
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

  return (
    <main
      style={{
        minHeight: '100vh',
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

      {/* En-tête */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {tProfile('title')}
          </h1>
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
        <RankBadge rank={rank} size="lg" />
      </div>

      {/* Stats résumé */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
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
            style={{
              padding: 20,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'var(--font-mono)',
                fontSize: 28,
                color: 'var(--color-accent)',
                fontWeight: 700,
              }}
            >
              {stat.value}
              <span
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-muted)',
                  marginLeft: 4,
                }}
              >
                {stat.unit}
              </span>
            </p>
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
                {d}j
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

      {/* Lien retour */}
      <Link
        href="/"
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
