'use client';

/**
 * WaveformBars — visualiseur de barres réactif aux notes jouées.
 *
 * 12 barres verticales qui pulsent à chaque frappe correcte.
 * La hauteur de la barre activée correspond à la position relative
 * de la note dans la gamme pentatonique (grave → aigu = gauche → droite).
 * Une erreur : flash rouge + toutes les barres reviennent à minimum.
 *
 * Client Component justifié : animation React state, réaction aux notes en temps réel.
 * Spec : docs/specs/27-waveform-visualizer.md
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

const BAR_COUNT = PENTATONIC_NOTES.length; // 12

interface WaveformBarsProps {
  /** Dernière note jouée — undefined si silence/erreur */
  lastNote?: string | undefined;
  /** true si la dernière frappe était une erreur */
  isError?: boolean;
  className?: string;
}

export function WaveformBars({
  lastNote,
  isError = false,
  className,
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

    const idx = PENTATONIC_NOTES.indexOf(lastNote);
    if (idx === -1) return;

    setActiveBar(idx);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setActiveBar(null),
      shouldReduceMotion ? 0 : 200,
    );
  }, [lastNote, isError, shouldReduceMotion]);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: 32,
        width: '100%',
        padding: '0 0 2px',
      }}
    >
      {PENTATONIC_NOTES.map((note, i) => {
        const isActive = activeBar === i;
        // Hauteur relative au registre : basses graves = petite barre, aigus = grande
        const baseHeight = 4 + Math.floor((i / BAR_COUNT) * 8); // 4px à 12px
        const activeHeight = 8 + Math.floor((i / BAR_COUNT) * 22); // 8px à 30px

        return (
          <div
            key={note}
            style={{
              flex: 1,
              height: isActive ? activeHeight : baseHeight,
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
