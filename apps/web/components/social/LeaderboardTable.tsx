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
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const tRanks = useTranslations('ranks');
  const reduceMotion = useReducedMotion();

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
      transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
    },
  };

  return (
    <motion.ul
      variants={containerVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? false : 'show'}
      className="flex flex-col w-full border-t border-[var(--color-border)]"
    >
      {sorted.map((entry, i) => {
        const tier = rankTierForWpm(entry.wpm);
        // Podium en 2 tons (or/argent), le reste en text-muted plein (pas de
        // fondu supplémentaire : color-mix vers transparent sur un fond
        // sombre tombait sous 2:1 de contraste, illisible au-delà du top 3).
        // Classes Tailwind plutôt que style inline : group-hover a besoin de
        // pouvoir gagner sur la couleur de repos, un style inline l'aurait
        // toujours emporté.
        const rankColorClass =
          i === 0
            ? 'text-[var(--color-accent)]'
            : i === 1
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)]';

        return (
          <motion.li
            key={`${entry.achievedAt}-${i}`}
            variants={itemVariants}
            className="group flex flex-col sm:flex-row sm:items-center justify-between px-3 md:px-6 py-4 md:py-5 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors duration-300 relative overflow-hidden"
          >
            {/* Background Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8 relative z-10">
              {/* Massive Rank Number (reduced) */}
              <div
                className={`font-display text-4xl md:text-5xl leading-none tracking-tighter w-16 md:w-20 shrink-0 transition-colors duration-300 ${rankColorClass} group-hover:text-[var(--color-accent)]`}
              >
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Primary Metric: WPM */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl md:text-4xl text-[var(--color-text-primary)] font-bold tracking-tight">
                    {entry.wpm}
                  </span>
                  <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                    {t('wpmHeader')}
                  </span>
                </div>
                
                {/* Secondary Metric: Accuracy */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                    {t('accuracyHeader')}:
                  </span>
                  <span className="font-mono text-[10px] md:text-xs text-[var(--color-text-primary)]">
                    {entry.accuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata: Tier & Mode (Pure Typographic Readout) */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 mt-4 sm:mt-0 relative z-10">
              <div className="flex items-center gap-2 font-mono text-[10px] md:text-xs uppercase tracking-widest">
                <span className="text-[var(--color-text-muted)] opacity-50">{t('modeHeader')} {'//'}</span>
                <span className="text-[var(--color-text-primary)]">{entry.mode}</span>
              </div>
              
              <div className="flex items-center gap-2 font-mono text-[10px] md:text-xs uppercase tracking-widest">
                <span className="text-[var(--color-text-muted)] opacity-50">{t('levelHeader')} {'//'}</span>
                <span style={{ color: RANKS[tier].accentColor }}>{tRanks(tier)}</span>
              </div>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
