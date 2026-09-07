'use client';

/**
 * ProfilClient : le dashboard profil, rendu comme un artefact gravé.
 *
 * Le centre de la page est « Le Rouleau » (PracticeRoll) : toute la pratique
 * de l'utilisateur en un seul objet, façon rouleau de piano mécanique, qui
 * absorbe la progression, l'activité et l'accès aux replays. Le masthead porte
 * l'identité (rang narratif), l'échelle de rang (RankLadder) porte le retour.
 * Prolonge le langage « la séance gravée » de l'écran de résultats.
 *
 * Client Component justifié : IndexedDB, Zustand, motion.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md (Profil & analytics)
 */

import { PracticeRoll } from '@/components/profile/PracticeRoll';
import { ProfileSpotlight } from '@/components/profile/ProfileSpotlight';
import { RankLadder } from '@/components/profile/RankLadder';
import { NumberTicker } from '@/components/ui/NumberTicker';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { useEntranceAnimated } from '@/hooks/useEntranceAnimated';
import {
  getPersonalRecords,
  getPreference,
  getSessionById,
  getSessions,
  getUserProfile,
  setPreference,
} from '@/lib/db';
import { rankUpSessionIds } from '@/lib/rank-milestones';
import { generateReplayLink } from '@/lib/replay';
import { useProgressionStore } from '@/stores/useProgressionStore';
import type { PersonalRecords, RankTier, SessionResult } from '@typewav/types';
import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const RANK_TIERS: RankTier[] = [
  'novice',
  'apprentice',
  'operator',
  'architect',
  'ghost',
];

const PROFILE_LAST_SEEN_KEY = 'typewav-profile-last-seen';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
    : Math.round(sorted[mid] ?? 0);
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 20 },
  },
};

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

// Grille asymétrique en flex : le rouleau (base 560) et la colonne
// records/rang (base 320, plafonnée) passent en une seule colonne sous
// ~940px sans média-query.
export function ProfilClient() {
  const { setProfile, setPersonalRecords, setRank } = useProgressionStore();
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tRanks = useTranslations('ranks');
  const locale = useLocale();
  const router = useRouter();
  const animating = useEntranceAnimated();

  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [records, setRecords] = useState<PersonalRecords | null>(null);
  const [rank, setLocalRank] = useState<RankTier>('novice');
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(true);
  const [visitDelta, setVisitDelta] = useState<{
    sessions: number;
    wpm: number;
  } | null>(null);

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
      setProfile(profile);
      setRank(profile.currentRank);
      if (personalRecords) setPersonalRecords(personalRecords);

      // Delta « depuis la dernière visite » : le trigger de retour le plus
      // honnête. Persisté en IndexedDB (règle projet : jamais localStorage).
      const snapshot = {
        count: allSessions.length,
        wpm: median(allSessions.map((s) => s.wpm)),
      };
      try {
        const prev = await getPreference<{ count: number; wpm: number }>(
          PROFILE_LAST_SEEN_KEY,
        );
        if (prev && snapshot.count > prev.count) {
          setVisitDelta({
            sessions: snapshot.count - prev.count,
            wpm: snapshot.wpm - prev.wpm,
          });
        }
        await setPreference(PROFILE_LAST_SEEN_KEY, snapshot);
      } catch {
        // best-effort : le delta est un bonus, pas un bloquant
      }

      setLoading(false);
    }
    void load();
  }, [setProfile, setPersonalRecords, setRank]);

  const shellStyle = {
    minHeight: 'calc(100dvh - var(--nav-height))',
    padding: 'clamp(40px, 6vh, 72px) clamp(20px, 4vw, 40px)',
    maxWidth: 1200,
    margin: '0 auto',
  } satisfies React.CSSProperties;

  if (loading) {
    return (
      <ProfileSpotlight>
        <main style={shellStyle}>
          <div
            className="skeleton"
            style={{ width: '55%', height: 90, marginBottom: 40 }}
          />
          <div
            className="skeleton"
            style={{ width: '100%', height: 1, marginBottom: 56, opacity: 0.4 }}
          />
          <div className="profile-grid">
            <div className="skeleton" style={{ height: 340 }} />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 40,
              }}
            >
              <div className="skeleton" style={{ width: '70%', height: 120 }} />
              <div className="skeleton" style={{ width: '100%', height: 260 }} />
            </div>
          </div>
        </main>
      </ProfileSpotlight>
    );
  }

  const totalSessions = sessions.length;
  const hasHistory = totalSessions > 0;
  const medianWpm = median(sessions.map((s) => s.wpm));
  const medianAccuracy = median(sessions.map((s) => s.accuracy));
  const rankUps = rankUpSessionIds(sessions);

  const rankLabels = Object.fromEntries(
    RANK_TIERS.map((tier) => [tier, tRanks(tier)]),
  ) as Record<RankTier, string>;

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
    router.push(`/${locale}${generateReplayLink(replayData)}`);
  };

  const markLabel = (s: SessionResult) =>
    tProfile('rollMark', {
      date: new Date(s.timestamp).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
      }),
      wpm: s.wpm,
      accuracy: Math.round(s.accuracy),
    });

  const orchestrated = animating
    ? {
        variants: containerVariants,
        initial: 'hidden' as const,
        animate: 'show' as const,
      }
    : {};

  return (
    <ProfileSpotlight>
      <motion.main {...orchestrated} style={shellStyle}>
        {/* Masthead : l'identité */}
        <motion.header
          variants={itemVariants}
          style={{
            borderBottom:
              '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
            paddingBottom: 40,
            marginBottom: 56,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 32,
          }}
        >
          <div>
            <span style={{ ...EYEBROW, display: 'block', marginBottom: 14 }}>
              {tProfile('currentStatus')}
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                fontSize: 'clamp(2.75rem, 8vw, 5.5rem)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              <ScrambleText
                text={tRanks(rank)}
                enabled={animating}
                delay={0.15}
              />
            </h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 24,
                marginTop: 22,
                flexWrap: 'wrap',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span
                style={{ fontSize: '1.35rem', color: 'var(--color-text-primary)' }}
              >
                <NumberTicker
                  value={medianWpm}
                  animate={animating}
                  delay={0.2}
                />{' '}
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}
                >
                  {tProfile('medianWpm')}
                </span>
              </span>
              <span
                style={{ fontSize: '1.35rem', color: 'var(--color-text-primary)' }}
              >
                <NumberTicker
                  value={medianAccuracy}
                  animate={animating}
                  delay={0.28}
                />
                %{' '}
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}
                >
                  {tProfile('medianAccuracy')}
                </span>
              </span>
              {pseudo && (
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    paddingLeft: 24,
                    borderLeft:
                      '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
                  }}
                >
                  @{pseudo}
                </span>
              )}
            </div>
            {visitDelta && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--color-accent)',
                  letterSpacing: '0.04em',
                  margin: '14px 0 0',
                }}
              >
                {tProfile('sinceLastVisit', {
                  sessions: visitDelta.sessions,
                  hasWpm: visitDelta.wpm > 0 ? 'yes' : 'no',
                  wpm: visitDelta.wpm,
                })}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ ...EYEBROW, display: 'block', marginBottom: 10 }}>
              {tProfile('sessionCount', { count: totalSessions })}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.75rem',
                lineHeight: 1,
                color: 'var(--color-text-primary)',
              }}
            >
              <NumberTicker
                value={totalSessions}
                animate={animating}
                delay={0.34}
              />
            </span>
          </div>
        </motion.header>

        <div className="profile-grid">
          {/* Colonne large : Le Rouleau */}
          <motion.section variants={itemVariants}>
            <h2 style={{ ...EYEBROW, margin: '0 0 24px' }}>
              {tProfile('rollHeading')}
            </h2>
            <PracticeRoll
              sessions={sessions}
              {...(records?.maxWpm.sessionId
                ? { recordWpmSessionId: records.maxWpm.sessionId }
                : {})}
              {...(records?.maxAccuracy.sessionId
                ? { recordAccSessionId: records.maxAccuracy.sessionId }
                : {})}
              rankUpSessionIds={rankUps}
              onReplaySession={(id) => void handleOpenReplay(id)}
              markLabel={markLabel}
              rollLabel={(count) => tProfile('rollAria', { count })}
              formatRulerDate={(ts) =>
                new Date(ts).toLocaleDateString(locale, {
                  month: 'short',
                  year: '2-digit',
                })
              }
              emptyLabel={tProfile('rollEmpty')}
              animate={animating}
            />
            {!hasHistory && (
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  marginTop: 20,
                }}
              >
                {tProfile('emptyLead')}
              </p>
            )}
          </motion.section>

          {/* Colonne étroite : Records + Rang */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 48,
            }}
          >
            {hasHistory && (
              <motion.section variants={itemVariants}>
                <h2
                  style={{
                    ...EYEBROW,
                    borderBottom:
                      '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
                    paddingBottom: 14,
                    margin: '0 0 28px',
                  }}
                >
                  {tProfile('personalRecords')}
                </h2>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
                >
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: 6,
                      }}
                    >
                      {tProfile('recordWpm')}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '3.5rem',
                        lineHeight: 1,
                        color: 'var(--color-accent)',
                      }}
                    >
                      <NumberTicker
                        value={records?.maxWpm.value ?? 0}
                        animate={animating}
                        delay={0.42}
                      />
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: 6,
                      }}
                    >
                      {tProfile('recordAccuracy')}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2.5rem',
                        lineHeight: 1,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <NumberTicker
                        value={Math.round(records?.maxAccuracy.value ?? 0)}
                        animate={animating}
                        delay={0.48}
                      />
                      %
                    </span>
                  </div>
                </div>
              </motion.section>
            )}

            <motion.section variants={itemVariants}>
              <h2
                style={{
                  ...EYEBROW,
                  borderBottom:
                    '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
                  paddingBottom: 14,
                  margin: '0 0 24px',
                }}
              >
                {tProfile('rank')}
              </h2>
              <RankLadder
                currentRank={rank}
                currentWpm={medianWpm}
                labels={rankLabels}
                nextRankText={(nextLabel, wpm, gap) =>
                  tProfile('nextRank', { rank: nextLabel, wpm, gap })
                }
                maxedText={tProfile('rankMaxed')}
                animate={animating}
              />
            </motion.section>
          </div>
        </div>

        <motion.footer
          variants={itemVariants}
          style={{
            marginTop: 88,
            paddingTop: 32,
            borderTop:
              '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <Link
            href={`/${locale}`}
            className="transition-colors duration-150 hover:text-[var(--color-text-primary)]"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            {tCommon('backToTyping')}
          </Link>
          <span>
            {tProfile('dataLocal')}{' '}
            <Link
              href={`/${locale}/parametres`}
              className="transition-colors duration-150 hover:text-[var(--color-text-primary)]"
              style={{
                color: 'var(--color-text-muted)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {tProfile('manageData')}
            </Link>
          </span>
        </motion.footer>
      </motion.main>
    </ProfileSpotlight>
  );
}
