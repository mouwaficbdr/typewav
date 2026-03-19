'use client';

/**
 * WpmChart — graphique WPM de la session.
 *
 * Courbes : raw (gris) + net (teal).
 * Points erreurs : var(--color-error).
 * SessionWaveform en overlay fond (opacité 0.15).
 *
 * Utilise SVG natif (pas de lib externe — bundle léger).
 * Client Component justifié : ResizeObserver (dimensions dynamiques).
 * Spec : docs/specs/30-results-refonte.md
 */

import { SessionWaveform } from '@/components/typing/SessionWaveform';
import type { NoteEvent } from '@typewav/types';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export interface WpmPoint {
  wordIndex: number;
  wpmRaw: number;
  wpmNet: number;
  hasError: boolean;
}

interface WpmChartProps {
  points: WpmPoint[];
  noteEvents?: NoteEvent[];
  durationMs: number;
  height?: number;
}

export function WpmChart({
  points,
  noteEvents = [],
  durationMs,
  height = 200,
}: WpmChartProps) {
  const t = useTranslations('typing');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height }}
        aria-hidden="true"
      />
    );
  }

  const effectiveWidth = containerWidth;
  const maxWpm = Math.max(...points.map((p) => p.wpmRaw), 1);
  const paddingX = 40;
  const paddingY = 20;
  const chartW = effectiveWidth - paddingX * 2;
  const chartH = height - paddingY * 2;

  const toX = (i: number) => paddingX + (i / (points.length - 1 || 1)) * chartW;
  const toY = (wpm: number) => paddingY + chartH - (wpm / maxWpm) * chartH;

  const rawPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.wpmRaw)}`)
    .join(' ');

  const netPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.wpmNet)}`)
    .join(' ');

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* SessionWaveform en overlay fond — opacité 15% */}
      {noteEvents.length > 2 && (
        <div
          style={{
            position: 'absolute',
            top: paddingY,
            bottom: paddingY,
            left: paddingX,
            right: paddingX,
            opacity: 0.15,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <SessionWaveform
            noteEvents={noteEvents}
            durationMs={durationMs}
            width={chartW}
            height={chartH}
          />
        </div>
      )}

      <svg
        viewBox={`0 0 ${effectiveWidth} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        role="img"
        aria-label={t('ariaWpmChart')}
      >
        {/* Axe Y */}
        <line
          x1={paddingX}
          y1={paddingY}
          x2={paddingX}
          y2={paddingY + chartH}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {/* Axe X */}
        <line
          x1={paddingX}
          y1={paddingY + chartH}
          x2={paddingX + chartW}
          y2={paddingY + chartH}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {/* Courbe raw — gris */}
        <path
          d={rawPath}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={1.5}
          opacity={0.5}
        />
        {/* Courbe net — teal */}
        <path
          d={netPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
        />
        {/* Points erreurs */}
        {points
          .filter((p) => p.hasError)
          .map((p) => (
            <circle
              key={p.wordIndex}
              cx={toX(points.indexOf(p))}
              cy={toY(p.wpmNet)}
              r={3}
              fill="var(--color-error)"
            />
          ))}
      </svg>
    </div>
  );
}
