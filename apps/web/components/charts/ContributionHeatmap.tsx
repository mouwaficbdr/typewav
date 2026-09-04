'use client';

/**
 * ContributionHeatmap — heatmap 90 jours inspirée de GitHub.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Dashboard profil
 * Client Component justifié : data transformations côté client.
 */

import type { SessionResult } from '@typewav/types';
import { useFormatter, useTranslations } from 'next-intl';

interface ContributionHeatmapProps {
  sessions: SessionResult[];
}

const DAY_MS = 86_400_000;

/**
 * Construit la grille 90 jours. La mise en forme de la date de chaque cellule
 * est déléguée à `formatDate` (locale-aware côté composant via `useFormatter`).
 */
export function buildHeatmapData(
  sessions: SessionResult[],
  formatDate: (timestamp: number) => string,
  now: number = Date.now(),
) {
  // Compter les sessions par jour (90 derniers jours)
  const countByDay = new Map<string, number>();
  for (const s of sessions) {
    const daysAgo = Math.floor((now - s.timestamp) / DAY_MS);
    if (daysAgo > 90) continue;
    const key = String(daysAgo);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  // Construire la grille (90 jours, colonnes de 7)
  const cells: { daysAgo: number; count: number; date: string }[] = [];
  for (let d = 89; d >= 0; d--) {
    const count = countByDay.get(String(d)) ?? 0;
    cells.push({ daysAgo: d, count, date: formatDate(now - d * DAY_MS) });
  }

  return cells;
}

function getColor(count: number): string {
  if (count === 0) return 'var(--color-surface)';
  if (count === 1)
    return 'color-mix(in srgb, var(--color-accent) 35%, var(--color-surface))';
  if (count <= 3)
    return 'color-mix(in srgb, var(--color-accent) 65%, var(--color-surface))';
  return 'var(--color-accent)';
}

export function ContributionHeatmap({ sessions }: ContributionHeatmapProps) {
  const t = useTranslations('profile');
  const format = useFormatter();

  const cells = buildHeatmapData(sessions, (ts) =>
    format.dateTime(new Date(ts), {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
  );

  // Organiser en colonnes de 7 (semaines)
  const WEEKS = Math.ceil(cells.length / 7);
  const CELL_SIZE = 12;
  const GAP = 3;
  const totalWidth = WEEKS * (CELL_SIZE + GAP);
  const totalHeight = 7 * (CELL_SIZE + GAP);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{ minWidth: totalWidth, maxWidth: '100%' }}
        aria-label={t('heatmapAria')}
      >
        {cells.map((cell, i) => {
          const week = Math.floor(i / 7);
          const dayOfWeek = i % 7;
          const x = week * (CELL_SIZE + GAP);
          const y = dayOfWeek * (CELL_SIZE + GAP);

          return (
            <rect
              key={cell.daysAgo}
              x={x}
              y={y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={getColor(cell.count)}
              style={{ transition: 'fill 0.2s' }}
            >
              <title>
                {cell.date} · {t('heatmapSessions', { count: cell.count })}
              </title>
            </rect>
          );
        })}
      </svg>

      {/* Légende */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        <span>{t('heatmapLess')}</span>
        {[0, 1, 2, 4].map((count) => (
          <div
            key={count}
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: getColor(count),
            }}
          />
        ))}
        <span>{t('heatmapMore')}</span>
      </div>
    </div>
  );
}
