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
import { useTranslations } from 'next-intl';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const tRanks = useTranslations('ranks');

  if (entries.length === 0) {
    return (
      <p
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.85rem',
          textAlign: 'center',
          padding: '2rem 0',
        }}
      >
        {t('noData')}
      </p>
    );
  }

  const sorted = [...entries].sort((a, b) => b.wpm - a.wpm);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.85rem',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              textAlign: 'left',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontSize: '0.7rem',
            }}
          >
            <th style={{ padding: '0.5rem 1rem 0.5rem 0' }}>
              {t('rankHeader')}
            </th>
            <th style={{ padding: '0.5rem 1rem' }}>{t('wpmHeader')}</th>
            <th style={{ padding: '0.5rem 1rem' }}>{t('accuracyHeader')}</th>
            <th style={{ padding: '0.5rem 1rem' }}>{t('modeHeader')}</th>
            <th style={{ padding: '0.5rem 1rem' }}>{t('levelHeader')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => {
            const tier = rankTierForWpm(entry.wpm);
            return (
              <tr
                key={`${entry.achievedAt}-${i}`}
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <td
                  style={{
                    padding: '0.75rem 1rem 0.75rem 0',
                    color:
                      i === 0
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                    fontWeight: i === 0 ? 700 : 400,
                  }}
                >
                  {i + 1}
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {entry.wpm}
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {entry.accuracy.toFixed(1)}%
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {entry.mode}
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    color: RANKS[tier].accentColor,
                  }}
                >
                  {tRanks(tier)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
