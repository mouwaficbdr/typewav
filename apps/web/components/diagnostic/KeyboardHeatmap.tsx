'use client';

/**
 * KeyboardHeatmap — représentation SVG des touches avec gradient de performance.
 * Couleur : vert (rapide) → orange → rouge (lent).
 *
 * Client Component justifié : données dynamiques depuis IndexedDB.
 * Spec : docs/specs/02-diagnostic.md
 */

import type { BigramStats } from '@typewav/types';

interface KeyboardHeatmapProps {
  /** Statistiques de bigram pour colorer les touches */
  bigramStats: BigramStats[];
}

// Disposition QWERTY standard — 3 rangées
const KEYBOARD_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const KEY_SIZE = 36;
const KEY_GAP = 4;
const ROW_OFFSETS = [0, KEY_SIZE * 0.25, KEY_SIZE * 0.5]; // décalages standard QWERTY

/**
 * Calcule un score de chaleur (0 = rapide/vert, 1 = lent/rouge)
 * à partir des stats de bigram pour une touche donnée.
 */
function getHeatScore(key: string, bigramStats: BigramStats[]): number {
  const relatedBigrams = bigramStats.filter(
    (b) => b.bigram.includes(key) && b.occurrences > 0,
  );
  if (relatedBigrams.length === 0) return 0;

  const avgMs =
    relatedBigrams.reduce((sum, b) => sum + b.avgMs, 0) / relatedBigrams.length;

  // Normalisation : < 100ms = 0 (vert), > 400ms = 1 (rouge)
  return Math.min(1, Math.max(0, (avgMs - 100) / 300));
}

/**
 * Interpole entre vert (#00D4AA), orange (#FF8000), rouge (#FF4444).
 */
function heatColor(score: number): string {
  if (score < 0.5) {
    // Vert → orange
    const t = score * 2;
    const r = Math.round(0 + t * 255);
    const g = Math.round(212 + t * (128 - 212));
    const b = Math.round(170 + t * (0 - 170));
    return `rgb(${r},${g},${b})`;
  } else {
    // Orange → rouge
    const t = (score - 0.5) * 2;
    const r = 255;
    const g = Math.round(128 + t * (68 - 128));
    const b = Math.round(0 + t * 68);
    return `rgb(${r},${g},${b})`;
  }
}

export function KeyboardHeatmap({ bigramStats }: KeyboardHeatmapProps) {
  const totalWidth =
    KEYBOARD_ROWS[0]!.length * (KEY_SIZE + KEY_GAP) -
    KEY_GAP +
    ROW_OFFSETS[2]! * 2;
  const totalHeight = 3 * KEY_SIZE + 2 * KEY_GAP + 16;

  return (
    <div aria-label="Heatmap du clavier — performance par touche">
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{ width: '100%', maxWidth: `${totalWidth}px`, height: 'auto' }}
        role="img"
        aria-label="Clavier QWERTY avec gradient de performance"
      >
        {KEYBOARD_ROWS.map((row, rowIndex) =>
          row.map((key, keyIndex) => {
            const x = ROW_OFFSETS[rowIndex]! + keyIndex * (KEY_SIZE + KEY_GAP);
            const y = rowIndex * (KEY_SIZE + KEY_GAP);
            const score = getHeatScore(key, bigramStats);
            const hasData = bigramStats.some((b) => b.bigram.includes(key));
            const fill = hasData ? heatColor(score) : 'var(--color-surface)';

            return (
              <g key={key}>
                <rect
                  x={x}
                  y={y}
                  width={KEY_SIZE}
                  height={KEY_SIZE}
                  rx={4}
                  fill={fill}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  opacity={hasData ? 0.9 : 0.5}
                />
                <text
                  x={x + KEY_SIZE / 2}
                  y={y + KEY_SIZE / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                  fill={hasData ? 'var(--color-bg)' : 'var(--color-text-muted)'}
                >
                  {key}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
