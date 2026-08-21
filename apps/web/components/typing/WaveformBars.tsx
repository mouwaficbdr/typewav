'use client';

/**
 * WaveformBars — visualiseur de barres réactif aux notes jouées.
 *
 * Une note est pilotée par son pitch MIDI réel (0-127).
 */

import {
  mapPitchToBarIndex,
  type NotePitchMappingOptions,
} from '@/lib/note-visualization';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface WaveformBarsProps {
  pitch?: number | null;
  isError?: boolean;
  /**
   * true si la note qui vient de jouer marque la fin d'une phrase musicale
   * réelle (voir ParsedNote.isPhraseBoundary, @typewav/audio-engine) : un
   * repère irrégulier et non fabriqué dans le vrai morceau, pas un simple
   * flash uniforme comme pour une note normale.
   */
  isPhraseBoundary?: boolean;
  numBars?: number;
  maxHeightPx?: number;
  pitchMapping?: NotePitchMappingOptions;
  idlePulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function WaveformBars({
  pitch = null,
  isError = false,
  isPhraseBoundary = false,
  numBars = 12,
  maxHeightPx = 30,
  pitchMapping,
  idlePulse = false,
  className,
  style,
}: WaveformBarsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [isPeak, setIsPeak] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const scheduleStateUpdate = (update: () => void) => {
      queueMicrotask(() => {
        if (!cancelled) update();
      });
    };

    if (isError) {
      if (!shouldReduceMotion) {
        scheduleStateUpdate(() => {
          setErrorFlash(true);
          setActiveBar(null);
          setIsPeak(false);
        });
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setErrorFlash(false), 300);
      }
      return () => {
        cancelled = true;
      };
    }

    if (pitch === null) {
      return () => {
        cancelled = true;
      };
    }

    const barIdx = mapPitchToBarIndex(pitch, numBars, pitchMapping);
    if (barIdx === null) {
      return () => {
        cancelled = true;
      };
    }

    scheduleStateUpdate(() => {
      setActiveBar(barIdx);
      setIsPeak(isPhraseBoundary);
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Une fin de phrase tient plus longtemps qu'une note normale : c'est ce
    // qui la rend perceptible comme un repère plutôt qu'un flash identique
    // à toutes les autres notes (voir isPhraseBoundary ci-dessus).
    timeoutRef.current = setTimeout(
      () => {
        setActiveBar(null);
        setIsPeak(false);
      },
      shouldReduceMotion ? 0 : isPhraseBoundary ? 450 : 250,
    );

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pitch, isError, isPhraseBoundary, shouldReduceMotion, numBars, pitchMapping]);

  const bars = Array.from({ length: numBars }, (_, i) => i);

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
          // Une fin de phrase illumine aussi les deux voisines : un repère
          // qui s'étale, pas un point isolé identique à une note normale.
          const isPeakNeighbor =
            isPeak && activeBar !== null && Math.abs(i - activeBar) === 1;
          const isLit = isActive || isPeakNeighbor;

          const normalized = Math.sin((i / (numBars - 1)) * Math.PI);
          const baseHeight = Math.round(
            Math.max(3, maxHeightPx * 0.15 + normalized * maxHeightPx * 0.2),
          );

          const delay = (i * 0.12).toFixed(2);
          const isIdle =
            idlePulse && !shouldReduceMotion && !isLit && activeBar === null;

          const scale = isActive
            ? (isPeak ? maxHeightPx * 1.15 : maxHeightPx) / baseHeight
            : isPeakNeighbor
              ? (maxHeightPx * 0.75) / baseHeight
              : 1;
          const glowStrength = isActive && isPeak ? 90 : 70;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: baseHeight,
                transform: 'scaleY(' + scale + ')',
                backgroundColor: errorFlash
                  ? 'var(--color-error)'
                  : isLit
                    ? 'var(--color-accent)'
                    : 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                boxShadow: isLit
                  ? `0 0 ${isActive && isPeak ? 16 : 10}px ${isActive && isPeak ? 3 : 2}px color-mix(in srgb, var(--color-accent) ${glowStrength}%, transparent)`
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
