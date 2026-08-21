'use client';

/**
 * AmbientAura — langage lumineux ambiant de la zone de frappe.
 *
 * Fusionne deux canaux jusqu'ici invisibles pendant la frappe elle-même :
 * - la couleur reflète le rang atteint (RANKS, @typewav/types), aujourd'hui
 *   utilisé uniquement dans le petit badge de /profil ;
 * - la respiration suit le tempo réel de la frappe (warpEngine.getCurrentBpm,
 *   voir useAudioStore.liveBpm), jusqu'ici sans aucun consommateur UI.
 *
 * Canal strictement périphérique : `pointer-events: none`, `aria-hidden`, et
 * un `z-index` négatif pour rester derrière tout le contenu réel. Aucune
 * information n'est portée uniquement par cette couleur — le rang et le WPM
 * restent lisibles ailleurs en texte (ActiveSessionHeader, /profil).
 */

import { useAudioStore } from '@/stores/useAudioStore';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { RANKS } from '@typewav/types';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface AmbientAuraProps {
  /** Pitch MIDI de la dernière note jouée (voir WaveformBars). */
  pitch: number | null;
  isError: boolean;
  isPhraseBoundary: boolean;
}

// Bornes du rythme de respiration : au-delà, la sensation devient un
// clignotement (trop rapide) ou une pause qui ne se lit plus comme vivante
// (trop lente), plutôt qu'un souffle qui suit vraiment la frappe.
const MIN_BEAT_MS = 250;
const MAX_BEAT_MS = 1500;
const IDLE_BEAT_MS = 750; // 80 BPM — même défaut que warpEngine au repos.

type PulseKind = 'none' | 'note' | 'peak' | 'error';

export function AmbientAura({
  pitch,
  isError,
  isPhraseBoundary,
}: AmbientAuraProps) {
  const rank = useProgressionStore((s) => s.rank);
  const liveBpm = useAudioStore((s) => s.liveBpm);
  const shouldReduceMotion = useReducedMotion();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = useState<PulseKind>('none');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accentColor = RANKS[rank].accentColor;

  // Écrit --beat-ms directement en DOM plutôt que via un objet de style React
  // : évite de re-render (et de re-diffuser un nouvel objet style) à chaque
  // frappe pour une seule variable CSS, la variable héritée pilote ensuite
  // l'animation CSS pure ci-dessous (compositeur GPU, pas de JS par frame).
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const beatMs = Math.round(
      Math.min(MAX_BEAT_MS, Math.max(MIN_BEAT_MS, 60000 / liveBpm)),
    );
    el.style.setProperty('--beat-ms', `${beatMs}ms`);
  }, [liveBpm]);

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    if (!isError && pitch === null) return undefined;

    let cancelled = false;
    // queueMicrotask plutôt qu'un setState synchrone dans le corps de
    // l'effet (voir le même pattern dans WaveformBars.tsx) : évite les
    // cascades de rendu que React signale sinon (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (cancelled) return;
      setPulse(isError ? 'error' : isPhraseBoundary ? 'peak' : 'note');
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setPulse('none'),
      isPhraseBoundary ? 900 : 400,
    );

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pitch, isError, isPhraseBoundary, shouldReduceMotion]);

  // Une erreur adoucit l'aura au lieu de l'alarmer en rouge : cohérent avec
  // la Phase 1 (l'erreur baisse la musique en fondu, ne la coupe jamais net
  // ni ne la sanctionne) — la pièce respire un peu moins fort, elle ne
  // clignote pas de rouge.
  //
  // Pourcentages volontairement hauts (vérifiés en navigateur avec capture
  // d'écran réelle, pas seulement en lisant le code) : contre un fond quasi
  // noir (#000000), un color-mix composite vers une couleur si sombre
  // qu'elle disparaît à l'écran en dessous d'environ 30% — deux premiers
  // passages (7-22% puis 6-42%) restaient invisibles en capture, l'exact
  // défaut que cette phase devait corriger sur WaveformBars.
  const topOpacityPct =
    pulse === 'error' ? 10 : pulse === 'peak' ? 65 : pulse === 'note' ? 50 : 35;
  const bottomOpacityPct =
    pulse === 'error' ? 7 : pulse === 'peak' ? 50 : pulse === 'note' ? 38 : 26;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes ambient-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: '-20vh',
          left: '-15vw',
          width: '55vw',
          height: '55vw',
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} ${topOpacityPct}%, transparent) 0%, transparent 65%)`,
          animation: shouldReduceMotion
            ? 'none'
            : `ambient-breathe var(--beat-ms, ${IDLE_BEAT_MS}ms) ease-in-out infinite`,
          transition: 'background 0.35s ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-25vh',
          right: '-15vw',
          width: '50vw',
          height: '50vw',
          maxWidth: 640,
          maxHeight: 640,
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} ${bottomOpacityPct}%, transparent) 0%, transparent 65%)`,
          animation: shouldReduceMotion
            ? 'none'
            : `ambient-breathe var(--beat-ms, ${IDLE_BEAT_MS}ms) ease-in-out infinite 0.4s`,
          transition: 'background 0.35s ease',
        }}
      />
    </div>
  );
}
