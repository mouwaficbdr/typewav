'use client';

/**
 * LeaderboardTable — classement hebdomadaire local.
 *
 * Phase 3 : classement basé sur les sessions IndexedDB de l'utilisateur
 * et les pseudos saisis lors des challenges. Pas de serveur requis.
 * Phase 4 ajoutera la sync Supabase pour le classement global.
 *
 * Spec : docs/specs/08 — Leaderboards contextuels
 * 'use client' justifié : state, filtres interactifs
 */

import type { LeaderboardEntry } from '@typewav/types';
import { useTranslations } from 'next-intl';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserPseudo?: string;
}

export function LeaderboardTable({
  entries,
  currentUserPseudo,
}: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');

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
            <th style={{ padding: '0.5rem 1rem' }}>{t('pseudoHeader')}</th>
            <th style={{ padding: '0.5rem 1rem' }}>{t('wpmHeader')}</th>
            <th style={{ padding: '0.5rem 1rem' }}>{t('accuracyHeader')}</th>
            <th style={{ padding: '0.5rem 1rem' }}>{t('modeHeader')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => {
            const isCurrentUser = entry.pseudo === currentUserPseudo;
            return (
              <tr
                key={`${entry.pseudo}-${entry.achievedAt}-${i}`}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  color: isCurrentUser
                    ? 'var(--color-accent)'
                    : 'var(--color-text-primary)',
                  background: isCurrentUser
                    ? 'rgba(0, 212, 170, 0.04)'
                    : 'transparent',
                }}
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
                <td style={{ padding: '0.75rem 1rem' }}>
                  {entry.pseudo || '—'}
                  {isCurrentUser && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.65rem',
                        color: 'var(--color-accent)',
                        opacity: 0.7,
                      }}
                    >
                      {t('you')}
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
