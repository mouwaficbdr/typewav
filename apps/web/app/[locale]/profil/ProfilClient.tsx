'use client';

/**
 * ProfilClient : dashboard profil principal.
 *
 * Client Component justifié : IndexedDB, Recharts interactif, Zustand.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md (Profil & analytics)
 * Spec : docs/specs/31-pages-refonte.md (FORGE [3] design direction)
 */

import { ContributionHeatmap } from '@/components/charts/ContributionHeatmap';
import { WpmProgressChart } from '@/components/charts/WpmProgressChart';
import {
  getPersonalRecords,
  getSessionById,
  getSessions,
  getUserProfile,
} from '@/lib/db';
import { generateReplayLink } from '@/lib/replay';
import { useProgressionStore } from '@/stores/useProgressionStore';
import type { PersonalRecords, RankTier, SessionResult } from '@typewav/types';
import { Play } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ProfileSpotlight } from '@/components/profile/ProfileSpotlight';
import { NumberTicker } from '@/components/ui/NumberTicker';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { useEffect, useState } from 'react';

type ChartDays = 7 | 30 | 90;

export function ProfilClient() {
  const { setProfile, setPersonalRecords, setRank } = useProgressionStore();
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tRanks = useTranslations('ranks');
  const locale = useLocale();
  const router = useRouter();

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
          minHeight: 'calc(100dvh - var(--nav-height))',
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

  const handleOpenReplay = async (sessionId: string) => {
    const session = await getSessionById(sessionId);
    if (!session?.text) return;
    const replayData = {
      sessionId: session.id,
      text: session.text,
      keystrokeTimings: session.keystrokeData.map((k) => k.deltaMs),
      wpm: session.wpm,
      accuracy: session.accuracy,
      theme: session.themeId,
      soundPack: session.soundPackId,
      achievedAt: session.timestamp,
    };
    const relativePath = generateReplayLink(replayData);
    router.push(`/${locale}${relativePath}`);
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 70, damping: 20 }
    }
  };

  return (
    <ProfileSpotlight>
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          minHeight: 'calc(100dvh - var(--nav-height))',
          padding: '64px 32px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Editorial Header */}
        <motion.header
          variants={itemVariants}
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '48px',
            marginBottom: '64px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '32px' }}>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '16px',
                }}
              >
                Current Status
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: 'clamp(3rem, 8vw, 6rem)',
                  lineHeight: 1,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                <ScrambleText text={tRanks(rank)} delay={0.2} duration={1200} />
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>
                  <NumberTicker value={avgWpm} delay={0.4} /> <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>WPM</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>
                  <NumberTicker value={avgAccuracy} delay={0.5} />% <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>ACC</span>
                </span>
                {pseudo && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-muted)',
                      marginLeft: '8px',
                      paddingLeft: '32px',
                      borderLeft: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    @{pseudo}
                  </motion.span>
                )}
              </div>
            </div>
            
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  display: 'block'
                }}
              >
                {tProfile('sessionCount', { count: totalSessions })}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '3rem',
                  lineHeight: 1,
                  color: 'var(--color-text-primary)',
                }}
              >
                <NumberTicker value={totalSessions} delay={0.6} />
              </span>
            </div>
          </div>
        </motion.header>

        {/* Asymmetric Grid Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '80px',
          }}
        >
          {/* Left Column: Data Visualization */}
          <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '80px' }}>
            
            {/* Progression Chart */}
            <motion.section variants={itemVariants}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {tProfile('wpmProgress')}
                </h2>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {([7, 30, 90] as ChartDays[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setChartDays(d)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: chartDays === d ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.875rem',
                        fontWeight: chartDays === d ? 500 : 400,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        transition: 'color 0.2s ease',
                        borderBottom: chartDays === d ? '1px solid var(--color-text-primary)' : '1px solid transparent',
                      }}
                    >
                      {tProfile('daysFilter', { count: d })}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: '300px', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <WpmProgressChart sessions={sessions} days={chartDays} />
              </div>
            </motion.section>

            {/* Heatmap */}
            <motion.section variants={itemVariants}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  color: 'var(--color-text-primary)',
                  margin: '0 0 32px 0',
                  letterSpacing: '-0.01em',
                }}
              >
                {tProfile('activity90Days')}
              </h2>
              <ContributionHeatmap sessions={sessions} />
            </motion.section>
          </div>

          {/* Right Column: Personal Records & Recent Sessions */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '80px' }}>
            
            {/* Personal Records */}
            <motion.section variants={itemVariants}>
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  paddingBottom: '16px',
                  margin: '0 0 32px 0',
                }}
              >
                Personal Records
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <span style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {tProfile('recordWpm')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', lineHeight: 1, color: 'var(--color-accent)' }}>
                    <NumberTicker value={records?.maxWpm.value ?? 0} delay={0.7} />
                  </span>
                </div>
                <div>
                  <span style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {tProfile('recordAccuracy')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', lineHeight: 1, color: 'var(--color-text-primary)' }}>
                    <NumberTicker value={Math.round(records?.maxAccuracy.value ?? 0)} delay={0.8} />%
                  </span>
                </div>
              </div>
            </motion.section>

            {/* Recent Sessions */}
            <motion.section variants={itemVariants}>
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  paddingBottom: '16px',
                  margin: '0 0 32px 0',
                }}
              >
                {tProfile('recentReplays')}
              </h2>
              
              {recentReplays.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
                  {tProfile('noReplays')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentReplays.map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 0.8, x: 0 }}
                      transition={{ delay: 1 + i * 0.1 }}
                      whileHover={{ opacity: 1, x: 4 }}
                      onClick={() => void handleOpenReplay(session.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                          {session.wpm} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>WPM</span>
                        </span>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {session.accuracy.toFixed(0)}% · {session.mode}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(session.timestamp).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                        </span>
                        <Play size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>
        </div>
        
        {/* Return Link */}
        <motion.div variants={itemVariants} style={{ marginTop: '100px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
          <Link
            href={`/${locale}`}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.2s ease',
            }}
            className="hover:text-text-primary"
          >
            &larr; {tCommon('backToTyping')}
          </Link>
        </motion.div>
      </motion.main>
    </ProfileSpotlight>
  );
}
