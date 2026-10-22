'use client';

import { motion, useReducedMotion } from 'motion/react';

export interface StaffHead {
  id: string;
  faded?: boolean;
}

interface StaffProps {
  /** Écran courant, 1 à 6 : ignoré par le rendu (purement décoratif), gardé pour le suivi externe. */
  step: number;
  /** Têtes posées par l'écran 2 à chaque touche juste (vide ailleurs). */
  heads: StaffHead[];
  /** Nombre de touches de l'écran 2 (espace la traînée) ; ignoré ailleurs. */
  trailLength?: number;
}

const LINE_COUNT = 5;
const LINE_GAP = 10;
const LINE_TOP = 30;
const VIEW_HEIGHT = 80;
const TRAIL_Y = LINE_TOP + LINE_GAP * 2;

/**
 * La portée : fil conducteur purement décoratif de l'Ouverture (spec partie
 * B, « La portée, fil conducteur »). Cinq lignes très fines qui traversent
 * l'écran, rien de plus : jusqu'au 2026-10-22 elle portait aussi 6 cercles de
 * progression ET les têtes de note de l'écran 2 au même langage visuel
 * (petits cercles), ce qui rendait les deux illisibles (retour Mouwafic :
 * « on ne comprend pas ce que ça fabrique »). La progression vit maintenant
 * ailleurs (`screen X / 6` dans Ouverture.tsx), et les têtes de note ne
 * mappent plus la hauteur réelle de la note (illisible sans lire une
 * partition) : elles s'allument en ligne, de gauche à droite, une par
 * touche juste, comme une traînée qui avance avec la frappe.
 */
export function Staff({ step, heads, trailLength = heads.length || 1 }: StaffProps) {
  const reduceMotion = useReducedMotion() === true;

  return (
    <div
      data-part="staff"
      data-staff-step={step}
      data-note-heads={heads.length}
      aria-hidden="true"
      style={{ position: 'relative', width: '100%', height: VIEW_HEIGHT }}
    >
      <svg
        width="100%"
        height={VIEW_HEIGHT}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {Array.from({ length: LINE_COUNT }, (_, i) => {
          const y = LINE_TOP + i * LINE_GAP;
          return reduceMotion ? (
            <line
              key={i}
              x1="0"
              x2="100%"
              y1={y}
              y2={y}
              stroke="var(--color-text-muted)"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ) : (
            <motion.line
              key={i}
              x1="0"
              x2="100%"
              y1={y}
              y2={y}
              stroke="var(--color-text-muted)"
              strokeOpacity={0.35}
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}

        {heads.map((head, i) => {
          const slot = Math.min(i, trailLength - 1);
          const cx = `${((slot + 1) / (trailLength + 1)) * 100}%`;
          return reduceMotion ? (
            <circle
              key={head.id}
              cx={cx}
              cy={TRAIL_Y}
              r={5}
              fill="var(--color-accent)"
              opacity={head.faded ? 0 : 1}
            />
          ) : (
            <motion.circle
              key={head.id}
              cy={TRAIL_Y}
              r={5}
              fill="var(--color-accent)"
              initial={{ cx, opacity: 0, scale: 0.4 }}
              animate={{ cx, opacity: head.faded ? 0 : 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </svg>
    </div>
  );
}
