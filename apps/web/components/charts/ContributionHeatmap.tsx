'use client';

/**
 * ContributionHeatmap — heatmap 90 jours inspirée de GitHub.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Dashboard profil
 * Client Component justifié : data transformations côté client.
 */

import type { SessionResult } from '@typewav/types';

interface ContributionHeatmapProps {
  sessions: SessionResult[];
}

function buildHeatmapData(sessions: SessionResult[]) {
  const now = Date.now();
  const DAY_MS = 86_400_000;

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
    const date = new Date(now - d * DAY_MS).toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    cells.push({ daysAgo: d, count, date });
  }

  return cells;
}

function getColor(count: number): string {
  if (count === 0) return '#1A1A2E';
  if (count === 1) return '#005541';
  if (count <= 3) return '#00A882';
  return '#00D4AA';
}

export function ContributionHeatmap({ sessions }: ContributionHeatmapProps) {
  const cells = buildHeatmapData(sessions);

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
        aria-label="Heatmap des sessions des 90 derniers jours"
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
                {cell.date} — {cell.count} session{cell.count !== 1 ? 's' : ''}
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
        <span>Moins</span>
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
        <span>Plus</span>
      </div>
    </div>
  );
}
