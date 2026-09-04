'use client';

/**
 * LeaderboardTable : classement local, rendu en tableau.
 *
 * Les entrées viennent des sessions IndexedDB de l'appareil. Aucun serveur,
 * aucune sync : la v1 n'a ni comptes ni classement mondial (comptes retirés
 * en PR #32), donc chaque ligne appartient déjà à l'utilisateur, une colonne
 * pseudo n'apporte rien. À la place, chaque performance affiche son palier
 * de tempo (RANKS, mêmes indications qu'ailleurs dans l'app : Largo,
 * Andante...) plutôt qu'un « vous » redondant.
 *
 * Spec : docs/specs/08 (Leaderboards contextuels)
 * 'use client' justifié : state, filtres interactifs
 */

import { rankTierForWpm } from '@/lib/progression';
import { RANKS } from '@typewav/types';
import type { LeaderboardEntry } from '@typewav/types';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const tRanks = useTranslations('ranks');

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-32 border-t border-[var(--color-border)]">
        <p className="font-mono text-sm uppercase tracking-widest text-[var(--color-text-muted)]">
          {t('noData')}
        </p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => b.wpm - a.wpm);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 200, damping: 20 },
    },
  };

  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col w-full border-t border-[var(--color-border)]"
    >
      {sorted.map((entry, i) => {
        const tier = rankTierForWpm(entry.wpm);
        const isTop3 = i < 3;
        const rankColor =
          i === 0
            ? 'var(--color-accent)'
            : i === 1
              ? 'var(--color-text-primary)'
              : i === 2
                ? 'var(--color-text-muted)'
                : 'color-mix(in srgb, var(--color-text-muted) 30%, transparent)';

        return (
          <motion.li
            key={`${entry.achievedAt}-${i}`}
            variants={itemVariants}
            className="group flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-6 md:py-8 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors duration-300 relative overflow-hidden"
          >
            {/* Background Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 relative z-10">
              {/* Massive Rank Number */}
              <div
                className="font-display text-6xl md:text-8xl leading-none tracking-tighter w-24 shrink-0 transition-colors duration-300 group-hover:text-[var(--color-accent)]"
                style={{ color: rankColor }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Primary Metric: WPM */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-5xl md:text-6xl text-[var(--color-text-primary)] font-bold tracking-tight">
                    {entry.wpm}
                  </span>
                  <span className="font-mono text-sm text-[var(--color-text-muted)] uppercase tracking-widest">
                    {t('wpmHeader')}
                  </span>
                </div>
                
                {/* Secondary Metric: Accuracy */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm text-[var(--color-text-muted)] uppercase tracking-widest">
                    {t('accuracyHeader')}:
                  </span>
                  <span className="font-mono text-sm text-[var(--color-text-primary)]">
                    {entry.accuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Badges: Tier & Mode */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 mt-6 md:mt-0 relative z-10">
              {/* Tier Badge */}
              <div
                className="px-3 py-1 border rounded-full font-mono text-xs uppercase tracking-widest transition-colors duration-300"
                style={{
                  color: RANKS[tier].accentColor,
                  borderColor: RANKS[tier].accentColor,
                  backgroundColor: `color-mix(in srgb, ${RANKS[tier].accentColor} 10%, transparent)`,
                }}
              >
                {tRanks(tier)}
              </div>

              {/* Mode */}
              <div className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                [ {entry.mode} ]
              </div>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
