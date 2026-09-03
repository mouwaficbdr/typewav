'use client';

/**
 * SessionWaveform : timeline SVG de la session complète.
 *
 * Visualise le rythme de frappe sur toute la durée de la session :
 * - Barres verticales = notes correctes (hauteur ∝ fréquence)
 * - Densité = vitesse de frappe (dense = rapide)
 *
 * Deux traitements :
 * - par défaut (overlay du WpmChart) : barres ancrées en bas, statiques.
 * - `mirror` + `draw` (écran de résultats) : barres symétriques autour d'un
 *   axe central façon sillon de vinyle, qui se gravent de gauche à droite.
 *
 * Client Component justifié : dimensions dynamiques, rendu conditionnel.
 * SSR-safe : toutes les données sont passées en props, pas de window.
 * Spec : docs/specs/27-waveform-visualizer.md
 */

import {
  mapNoteToBarHeight,
  type NotePitchMappingOptions,
} from '@/lib/note-visualization';
import type { NoteEvent } from '@typewav/types';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

interface SessionWaveformProps {
  noteEvents: NoteEvent[];
  /** Durée totale de la session en ms */
  durationMs: number;
  width?: number;
  height?: number;
  pitchMapping?: NotePitchMappingOptions;
  /** Barres symétriques autour d'un axe central plutôt qu'ancrées en bas. */
  mirror?: boolean;
  /** Les barres se gravent de gauche à droite à l'arrivée (une seule fois). */
  draw?: boolean;
  /** Durée totale du tracé en ms (réparti sur toutes les barres). */
  drawMs?: number;
}

const DRAW_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function SessionWaveform({
  noteEvents,
  durationMs,
  width = 600,
  height = 48,
  pitchMapping,
  mirror = false,
  draw = false,
  drawMs = 720,
}: SessionWaveformProps) {
  const t = useTranslations('typing');
  const reduceMotion = useReducedMotion();
  const animate = draw && !reduceMotion;

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

  const lastTimestamp = noteEvents[noteEvents.length - 1]?.timestamp ?? 0;
  // En héros (mirror), la mélodie remplit le cadre bord à bord : on cale sur
  // la dernière note, pas sur `durationMs` (qui peut inclure une traîne
  // silencieuse et décaler tout le tracé vers la gauche). En overlay du
  // WpmChart, on garde l'échelle temporelle pour rester aligné avec l'axe X.
  const maxTimestamp = mirror
    ? lastTimestamp || durationMs || 1
    : durationMs || lastTimestamp;

  // Mirror : on exploite toute la hauteur (barre centrée) ; sinon plage
  // d'origine 4→24 pour rester compatible avec l'overlay du WpmChart.
  const minBar = mirror ? 3 : 4;
  const maxBar = mirror ? height * 0.86 : 24;

  const bars = noteEvents.map((event, i) => {
    const x = maxTimestamp > 0 ? (event.timestamp / maxTimestamp) * width : 0;
    const barHeight = mapNoteToBarHeight(
      event.noteName,
      minBar,
      maxBar,
      pitchMapping,
    );
    const y = mirror ? (height - barHeight) / 2 : height - barHeight;
    // Fraction 0..1 de la position temporelle : pilote le délai du tracé.
    const frac = noteEvents.length > 1 ? i / (noteEvents.length - 1) : 0;
    return { x, y, barHeight, frac, key: event.charIndex };
  });

  const centerLine = mirror ? (
    <line
      x1={0}
      x2={width}
      y1={height / 2}
      y2={height / 2}
      stroke="var(--color-border)"
      strokeWidth={1}
    />
  ) : null;

  return (
    <figure aria-hidden="true" style={{ margin: 0, width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
        role="img"
        aria-label={t('ariaSessionWaveform')}
      >
        {!mirror && (
          <rect width={width} height={height} fill="var(--color-surface)" rx={4} />
        )}
        {centerLine}
        {bars.map(({ x, y, barHeight, frac, key }, i) => (
          <motion.rect
            key={`${key}-${i}`}
            x={x - 1}
            y={y}
            width={2}
            height={barHeight}
            fill="var(--color-accent)"
            rx={1}
            style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
            initial={animate ? { scaleY: 0, opacity: 0 } : false}
            animate={{ scaleY: 1, opacity: mirror ? 0.9 : 0.8 }}
            transition={
              animate
                ? {
                    duration: 0.34,
                    delay: (frac * drawMs) / 1000,
                    ease: DRAW_EASE,
                  }
                : { duration: 0 }
            }
          />
        ))}
      </svg>
    </figure>
  );
}
