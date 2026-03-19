'use client';

/**
 * SessionWaveform — timeline SVG de la session complète.
 *
 * Visualise le rythme de frappe sur toute la durée de la session :
 * - Barres verticales = notes correctes (hauteur ∝ fréquence)
 * - Densité = vitesse de frappe (dense = rapide)
 *
 * Client Component justifié : dimensions dynamiques, rendu conditionnel.
 * SSR-safe : toutes les données sont passées en props, pas de window.
 * Spec : docs/specs/27-waveform-visualizer.md
 */

import type { NoteEvent } from '@typewav/types';
import { useTranslations } from 'next-intl';

const PENTATONIC_NOTES = [
  'C3',
  'D3',
  'E3',
  'G3',
  'A3',
  'C4',
  'D4',
  'E4',
  'G4',
  'A4',
  'C5',
  'D5',
];

interface SessionWaveformProps {
  noteEvents: NoteEvent[];
  /** Durée totale de la session en ms */
  durationMs: number;
  width?: number;
  height?: number;
}

export function SessionWaveform({
  noteEvents,
  durationMs,
  width = 600,
  height = 48,
}: SessionWaveformProps) {
  const t = useTranslations('typing');

  if (noteEvents.length === 0) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      />
    );
  }

  const maxTimestamp =
    durationMs || (noteEvents[noteEvents.length - 1]?.timestamp ?? 0);

  const bars = noteEvents.map((event) => {
    const x = maxTimestamp > 0 ? (event.timestamp / maxTimestamp) * width : 0;
    const noteIdx = PENTATONIC_NOTES.indexOf(event.noteName);
    // barHeight : 4 (graves) → 24 (aigus) sur hauteur 48px
    const barHeight = noteIdx === -1 ? 8 : 4 + Math.round((noteIdx / 11) * 20);
    const y = height - barHeight;

    return { x, y, barHeight, key: event.charIndex };
  });

  return (
    <figure aria-hidden="true" style={{ margin: 0, width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
        role="img"
        aria-label={t('ariaSessionWaveform')}
      >
        {/* Background */}
        <rect
          width={width}
          height={height}
          fill="var(--color-surface)"
          rx={4}
        />

        {/* Barres de notes */}
        {bars.map(({ x, y, barHeight, key }, i) => (
          <rect
            key={`${key}-${i}`}
            x={x - 1}
            y={y}
            width={2}
            height={barHeight}
            fill="var(--color-accent)"
            rx={1}
            opacity={0.8}
          />
        ))}
      </svg>
    </figure>
  );
}
