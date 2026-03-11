'use client';

/**
 * WaveformBars — visualiseur de barres réactif aux notes jouées.
 *
 * 12 barres verticales (configurable) qui pulsent à chaque frappe correcte.
 * La hauteur de la barre activée correspond à la position relative
 * de la note dans la gamme pentatonique (grave → aigu = gauche → droite).
 * Une erreur : flash rouge + toutes les barres reviennent à minimum.
 *
 * Client Component justifié : animation React state, réaction aux notes en temps réel.
 * Spec : docs/specs/27-waveform-visualizer.md, docs/specs/29-home-layout.md
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
  /** Dernière note jouée — undefined si silence/erreur */
  lastNote?: string | undefined;
  /** true si la dernière frappe était une erreur */
  isError?: boolean;
  /** Nombre de barres affichées (défaut : 12) */
  barCount?: number;
  /** Hauteur max en px de la barre activée (défaut : 30) */
  maxHeightPx?: number;
  /** Légère pulsation de repos si silence (défaut : false) */
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
  const [idlePhase, setIdlePhase] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      shouldReduceMotion ? 0 : 200,
    );
  }, [lastNote, isError, shouldReduceMotion, barCount]);

  // Légère pulsation au repos (idlePulse)
  useEffect(() => {
    if (!idlePulse || shouldReduceMotion) return;
    idleRef.current = setInterval(() => {
      setIdlePhase((p) => p + 1);
    }, 800);
    return () => {
      if (idleRef.current) clearInterval(idleRef.current);
    };
  }, [idlePulse, shouldReduceMotion]);

  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: maxHeightPx + 8,
        width: '100%',
        padding: '0 0 2px',
        ...style,
      }}
    >
      {bars.map((i) => {
        const isActive = activeBar === i;
        const ratio = barCount > 1 ? i / (barCount - 1) : 0;
        const minH = Math.max(2, Math.round(maxHeightPx * 0.12));
        const baseHeight = minH + Math.floor(ratio * maxHeightPx * 0.25);
        const activeHeight =
          Math.floor(maxHeightPx * 0.25) +
          Math.floor(ratio * maxHeightPx * 0.75);

        // Idle pulse: subtle sinusoidal height variation
        const idleOffset =
          idlePulse && !shouldReduceMotion && !isActive
            ? Math.floor(
                Math.sin((idlePhase + i) * 0.7) *
                  Math.max(1, maxHeightPx * 0.1),
              )
            : 0;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: isActive
                ? activeHeight
                : Math.max(2, baseHeight + idleOffset),
              backgroundColor: errorFlash
                ? 'var(--color-error)'
                : isActive
                  ? 'var(--color-accent)'
                  : 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
              borderRadius: 'var(--radius-sm)',
              transition: shouldReduceMotion
                ? 'none'
                : 'height 0.15s ease-out, background-color 0.1s ease',
            }}
          />
        );
      })}
    </div>
  );
}
