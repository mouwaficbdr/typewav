'use client';

/**
 * WaveformBars — visualiseur de barres réactif aux notes jouées.
 *
 * Barres verticales (configurable) qui pulsent à chaque frappe correcte.
 * La hauteur de la barre activée correspond à la position relative
 * de la note dans la gamme pentatonique (grave → aigu = gauche → droite).
 * Une erreur : flash rouge + toutes les barres reviennent à minimum.
 */

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

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

interface WaveformBarsProps {
  lastNote?: string | undefined;
  isError?: boolean;
  barCount?: number;
  maxHeightPx?: number;
  idlePulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function WaveformBars({
  lastNote,
  isError = false,
  barCount = 12,
  maxHeightPx = 30,
  idlePulse = false,
  className,
  style,
}: WaveformBarsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [errorFlash, setErrorFlash] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isError) {
      if (!shouldReduceMotion) {
        setErrorFlash(true);
        setActiveBar(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setErrorFlash(false), 300);
      }
      return;
    }

    if (!lastNote) return;

    const noteIdx = PENTATONIC_NOTES.indexOf(lastNote);
    if (noteIdx === -1) return;

    const barIdx = Math.round(
      (noteIdx / (PENTATONIC_NOTES.length - 1)) * (barCount - 1),
    );
    setActiveBar(barIdx);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setActiveBar(null),
      shouldReduceMotion ? 0 : 250,
    );
  }, [lastNote, isError, shouldReduceMotion, barCount]);

  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <>
      <style>{`
        @keyframes typewav-idle-pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
      <div
        aria-hidden="true"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          height: maxHeightPx + 12,
          width: '100%',
          padding: '0 0 2px',
          ...style,
        }}
      >
        {bars.map((i) => {
          const isActive = activeBar === i;

          const normalized = Math.sin((i / (barCount - 1)) * Math.PI);
          const baseHeight = Math.round(
            Math.max(3, maxHeightPx * 0.15 + normalized * maxHeightPx * 0.2),
          );

          const delay = (i * 0.12).toFixed(2);
          const isIdle =
            idlePulse && !shouldReduceMotion && !isActive && activeBar === null;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: baseHeight,
                transform: isActive
                  ? 'scaleY(' + maxHeightPx / baseHeight + ')'
                  : 'scaleY(1)',
                backgroundColor: errorFlash
                  ? 'var(--color-error)'
                  : isActive
                    ? 'var(--color-accent)'
                    : 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                boxShadow: isActive
                  ? '0 0 10px 2px color-mix(in srgb, var(--color-accent) 70%, transparent)'
                  : 'none',
                borderRadius: 'var(--radius-sm)',
                transformOrigin: '50% 50%',
                animation: isIdle
                  ? 'typewav-idle-pulse 2s ease-in-out ' + delay + 's infinite'
                  : 'none',
                transition: shouldReduceMotion
                  ? 'none'
                  : 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease',
              }}
            />
          );
        })}
      </div>
    </>
  );
}
