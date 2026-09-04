'use client';

/**
 * PracticeRoll : toute la pratique de l'utilisateur en un seul artefact gravé,
 * façon rouleau de piano mécanique / bande sismographe.
 *
 * Gauche → droite dans le temps. Chaque séance = une marque verticale gravée :
 *   - hauteur    ∝ WPM
 *   - opacité    ∝ précision
 *   - accent + fanion = séance qui détient un record (WPM ou précision)
 * Une enveloppe lissée (moyenne glissante) donne la tendance ; une règle de
 * dates en pied situe la fenêtre. Les marques sont cliquables (vrais
 * <button>) pour rejouer la séance.
 *
 * Prolonge le langage « la séance gravée » de l'écran de résultats
 * (SessionWaveform, prop `draw`). Les libellés arrivent déjà localisés.
 */

import type { SessionResult } from '@typewav/types';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface PracticeRollProps {
  /** Séances, ordre ascendant par timestamp (comme getSessions). */
  sessions: readonly SessionResult[];
  recordWpmSessionId?: string;
  recordAccSessionId?: string;
  /** Séances qui ont fait franchir un palier de rang : marquées d'un point. */
  rankUpSessionIds?: readonly string[];
  onReplaySession: (sessionId: string) => void;
  /** aria-label + infobulle d'une marque. */
  markLabel: (session: SessionResult) => string;
  /** aria-label du visuel : (nombre de séances) => texte. */
  rollLabel: (count: number) => string;
  /** Formate une date de la règle en pied (déjà localisée par l'appelant). */
  formatRulerDate?: (timestamp: number) => string;
  /** Affiché quand il n'y a aucune séance. */
  emptyLabel: string;
  /** Grave les marques de gauche à droite à l'arrivée (une seule fois). */
  animate?: boolean;
  height?: number;
}

const DRAW_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const FALLBACK_W = 900;
const TOP_PAD = 20;
const RULER_PAD = 30;
const SIDE_PAD = 14;
const MIN_MARK = 4;
const ENVELOPE_WINDOW = 5;

function movingAverage(values: number[], window: number): number[] {
  const half = window >> 1;
  return values.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(values.length - 1, i + half);
    let sum = 0;
    let k = 0;
    for (let j = lo; j <= hi; j++) {
      sum += values[j] ?? 0;
      k += 1;
    }
    return k === 0 ? 0 : sum / k;
  });
}

export function PracticeRoll({
  sessions,
  recordWpmSessionId,
  recordAccSessionId,
  rankUpSessionIds,
  onReplaySession,
  markLabel,
  rollLabel,
  formatRulerDate = (ts) => new Date(ts).toLocaleDateString(),
  emptyLabel,
  animate = false,
  height = 340,
}: PracticeRollProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_W);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = height;
  const baseline = H - RULER_PAD;
  const usableH = baseline - TOP_PAD;

  if (sessions.length === 0) {
    return (
      <div
        ref={wrapRef}
        role="img"
        aria-label={emptyLabel}
        style={{ position: 'relative', width: '100%', height: H }}
      >
        <svg width={width} height={H} aria-hidden="true">
          <line
            x1={SIDE_PAD}
            y1={baseline}
            x2={width - SIDE_PAD}
            y2={baseline}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        </svg>
        <p
          style={{
            position: 'absolute',
            inset: `0 0 ${RULER_PAD}px 0`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            letterSpacing: '0.04em',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          {emptyLabel}
        </p>
      </div>
    );
  }

  const n = sessions.length;
  const maxWpm = Math.max(1, ...sessions.map((s) => s.wpm));
  const innerW = width - 2 * SIDE_PAD;

  const marks = sessions.map((s, i) => {
    const x = SIDE_PAD + (n <= 1 ? 0.5 : i / (n - 1)) * innerW;
    const h = MIN_MARK + (s.wpm / maxWpm) * (usableH - MIN_MARK);
    const acc = Math.max(0, Math.min(1, (s.accuracy - 80) / 20));
    // Plancher relevé : sur un fond de thème sombre les marques les moins
    // précises restaient quasi invisibles.
    const opacity = 0.5 + 0.45 * acc;
    const record =
      s.id === recordWpmSessionId
        ? ('wpm' as const)
        : s.id === recordAccSessionId
          ? ('accuracy' as const)
          : undefined;
    const rankUp = rankUpSessionIds?.includes(s.id) ?? false;
    return { s, i, x, h, opacity, record, rankUp };
  });

  const envelope = movingAverage(
    marks.map((m) => m.h),
    ENVELOPE_WINDOW,
  );
  const envPath = marks
    .map(
      (m, i) =>
        `${i === 0 ? 'M' : 'L'} ${m.x.toFixed(1)} ${(baseline - (envelope[i] ?? 0)).toFixed(1)}`,
    )
    .join(' ');

  const first = sessions[0];
  const last = sessions[n - 1];
  const firstLabel = first ? formatRulerDate(first.timestamp) : '';
  const lastLabel = last ? formatRulerDate(last.timestamp) : '';
  // Toutes les séances tombent dans la même borne (ex. un seul mois) :
  // deux libellés identiques aux deux bouts ne disent rien, on n'en garde
  // qu'un, centré.
  const singleRulerLabel =
    firstLabel !== '' && firstLabel === lastLabel ? firstLabel : null;
  const slot = innerW / n;
  const hitW = Math.max(10, slot);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', height: H }}
    >
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={rollLabel(n)}
        style={{ display: 'block' }}
      >
        <line
          x1={SIDE_PAD}
          y1={baseline}
          x2={width - SIDE_PAD}
          y2={baseline}
          stroke="var(--color-border)"
          strokeWidth={1}
        />

        <path
          d={envPath}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          strokeOpacity={0.55}
        />

        {marks.map((m) => {
          const isRecord = m.record !== undefined;
          const isActive = activeIdx === m.i;
          const stroke = isRecord
            ? 'var(--color-accent)'
            : 'var(--color-text-primary)';
          const top = baseline - m.h;
          const common = {
            x1: m.x,
            x2: m.x,
            y1: baseline,
            y2: top,
            stroke,
            strokeWidth: isRecord ? 2.25 : isActive ? 2.25 : 1.75,
            strokeOpacity: isActive ? 1 : m.opacity,
            strokeLinecap: 'round' as const,
          };
          return (
            <g key={m.s.id}>
              {animate ? (
                <motion.line
                  {...common}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    delay: (m.i / n) * 0.6,
                    duration: 0.3,
                    ease: DRAW_EASE,
                  }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                />
              ) : (
                <line {...common} />
              )}
              {isRecord && (
                <path
                  d={`M ${m.x - 3} ${top - 9} L ${m.x + 3} ${top - 9} L ${m.x} ${top - 3} Z`}
                  fill="var(--color-accent)"
                />
              )}
              {m.rankUp && (
                <circle
                  cx={m.x}
                  cy={top - (isRecord ? 15 : 8)}
                  r={2.5}
                  fill="var(--color-text-primary)"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Règle de dates */}
      {singleRulerLabel !== null ? (
        <span style={rulerStyle('center')}>{singleRulerLabel}</span>
      ) : (
        <>
          <span style={rulerStyle('left')}>{firstLabel}</span>
          <span style={rulerStyle('right')}>{lastLabel}</span>
        </>
      )}

      {/* Couche d'interaction : un vrai bouton par séance */}
      <div style={{ position: 'absolute', inset: `0 0 ${RULER_PAD}px 0` }}>
        {marks.map((m) => (
          <button
            key={m.s.id}
            type="button"
            aria-label={markLabel(m.s)}
            title={markLabel(m.s)}
            {...(m.record ? { 'data-record': m.record } : {})}
            {...(m.rankUp ? { 'data-rankup': '' } : {})}
            onClick={() => onReplaySession(m.s.id)}
            onMouseEnter={() => setActiveIdx(m.i)}
            onMouseLeave={() => setActiveIdx(null)}
            onFocus={() => setActiveIdx(m.i)}
            onBlur={() => setActiveIdx(null)}
            style={{
              position: 'absolute',
              left: m.x - hitW / 2,
              top: 0,
              width: hitW,
              height: '100%',
              padding: 0,
              margin: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          />
        ))}
        {activeIdx !== null && marks[activeIdx] && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: marks[activeIdx].x,
              top: baseline - marks[activeIdx].h - 10,
              transform: 'translate(-50%, -100%)',
              padding: '4px 8px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {markLabel(marks[activeIdx].s)}
          </div>
        )}
      </div>
    </div>
  );
}

function rulerStyle(side: 'left' | 'right' | 'center'): React.CSSProperties {
  const anchor: React.CSSProperties =
    side === 'center'
      ? { left: '50%', transform: 'translateX(-50%)' }
      : { [side]: SIDE_PAD };
  return {
    position: 'absolute',
    bottom: 6,
    ...anchor,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.66rem',
    letterSpacing: '0.06em',
    color: 'var(--color-text-muted)',
  };
}
