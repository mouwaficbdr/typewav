'use client';

/**
 * GhostCursor — curseur fantôme qui rejoue le record personnel.
 *
 * S'affiche en overlay direct dans la zone de texte (TypingArea).
 * Avance au rythme des keystrokeTimings du record personnel passé.
 * UI puriste : un curseur semi-transparent directement sur les caractères.
 *
 * Fidélité au timing enregistré : la position se recalcule à chaque frame
 * depuis le temps écoulé (performance.now() - ancrage), jamais par une
 * chaîne de setTimeout relatifs. Une chaîne dérive (chaque delay approximatif
 * s'accumule) et, pire, un onglet mis en arrière-plan fait throttler les
 * setTimeout par le navigateur : au retour, tous les timers en retard se
 * déclenchent d'un coup, ce qui se voit comme un bond en avant. Recalculer
 * depuis le temps absolu écoulé est auto-correcteur (chaque frame retombe
 * juste) et rend un bond en arrière structurellement impossible : la
 * position ne peut que suivre le temps écoulé, monotone par construction.
 *
 * Ne démarre qu'une fois la vraie session lancée (isSessionActive, vrai à
 * la première frappe réelle). Avant : le moteur tournait dès le montage du
 * composant, donc avant même que l'utilisateur ait cliqué dans la zone de
 * frappe.
 *
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Ghost mode
 */

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

interface GhostCursorProps {
  /** Timings inter-frappe du record personnel (ms entre chaque frappe) */
  ghostTimings: number[];
  /** Longueur totale du texte */
  textLength: number;
  /** Ref vers le conteneur des mots pour calculer les coordonnées X/Y */
  wordsRef: React.RefObject<HTMLDivElement | null>;
  /** Vrai une fois la session réellement démarrée (premier keystroke réel) */
  isSessionActive: boolean;
}

export function GhostCursor({
  ghostTimings,
  textLength,
  wordsRef,
  isSessionActive,
}: GhostCursorProps) {
  const shouldReduceMotion = useReducedMotion();
  const [ghostPosition, setGhostPosition] = useState(0);
  const [cursorStyle, setCursorStyle] = useState<{ x: number; y: number; width: number; height: number; opacity: number }>({ x: 0, y: 0, width: 0, height: 0, opacity: 0 });

  // Temps cumulé à chaque position : cumulative[k] = temps écoulé depuis
  // l'ancrage quand le fantôme atteint la position k. cumulative[0] = 0.
  const cumulative = useMemo(() => {
    const sums = [0];
    for (const delay of ghostTimings) {
      sums.push(sums[sums.length - 1]! + delay);
    }
    return sums;
  }, [ghostTimings]);

  const anchorRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  // Vrai dès le premier positionnement réussi, pour toujours. Découplé de
  // cursorStyle.width : un espace entre deux mots a une largeur de 0px tant
  // que le VRAI curseur (indépendant du fantôme) n'est pas dessus (voir le
  // rendu des mots dans TypingArea). Si on cache le fantôme sur
  // cursorStyle.width === 0, chaque espace démonte le <motion.div> ; au
  // prochain caractère, Framer Motion le remonte et l'anime depuis le style
  // statique top:0/left:0 (le coin du conteneur, à peu près la première
  // lettre du tout premier mot) avant d'appliquer la transform animate : un
  // flash bref mais visible « retour au début » à chaque changement de mot.
  const hasPositionedRef = useRef(false);

  // Moteur d'avancement du fantôme
  useEffect(() => {
    if (!isSessionActive || ghostTimings.length === 0) return;
    // Ancrage pris une seule fois, au tout premier passage à actif : un
    // second passage dans cet effet (deps qui changent de référence, ou
    // double-invocation React Strict Mode en dev) reprend depuis la
    // position déjà atteinte plutôt que de repartir de zéro.
    anchorRef.current ??= performance.now();

    function tick() {
      const anchor = anchorRef.current;
      if (anchor === null) return;
      const elapsed = performance.now() - anchor;
      let idx = positionRef.current;
      while (idx < textLength && elapsed >= (cumulative[idx + 1] ?? Infinity)) {
        idx += 1;
      }
      if (idx !== positionRef.current) {
        positionRef.current = idx;
        setGhostPosition(idx);
      }
      if (idx < textLength) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isSessionActive, ghostTimings, textLength, cumulative]);

  // Positionnement dynamique du curseur fantôme
  useLayoutEffect(() => {
    if (!wordsRef.current) return;
    
    // Le conteneur principal
    const wordsEl = wordsRef.current;
    
    // On cherche l'élément caractère cible
    // Note: On cible char-X en priorité.
    const targetEl = wordsEl.querySelector(`[data-testid="char-${ghostPosition}"]`) as HTMLElement;
    
    if (targetEl) {
      const parentRect = wordsEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // Coordonnées relatives au conteneur 'wordsRef'
      const x = targetRect.left - parentRect.left;
      const y = targetRect.top - parentRect.top;

      hasPositionedRef.current = true;
      setCursorStyle({
        x,
        y,
        width: targetRect.width,
        height: targetRect.height,
        opacity: ghostPosition >= textLength ? 0 : 1, // On le cache à la fin
      });
    }
  }, [ghostPosition, textLength, wordsRef]);

  // Rien avant le vrai départ de la session (voir isSessionActive plus
  // haut), et rien tant qu'aucun positionnement n'a encore réussi (évite un
  // flash au tout premier rendu). Une fois positionné, le composant reste
  // monté en continu : voir hasPositionedRef plus haut, sur un espace de
  // largeur 0 c'est Math.max(width, 12) juste en dessous qui prend le relais,
  // pas un démontage.
  if (!isSessionActive || !hasPositionedRef.current) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: Math.max(cursorStyle.width, 12), // Minimum width pour les espaces
        height: cursorStyle.height,
        // UI Puriste MonkeyType: un bloc semi-transparent au-dessus du texte
        background: 'color-mix(in srgb, var(--color-text-muted) 35%, transparent)',
        borderRadius: 'var(--radius-sm)',
        pointerEvents: 'none', // Ne doit pas bloquer les clics
        zIndex: 1, // Au-dessus du conteneur texte mais discret
      }}
      animate={{
        x: cursorStyle.x,
        y: cursorStyle.y,
        opacity: cursorStyle.opacity,
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              type: 'tween',
              ease: 'linear',
              duration: 0.1, // Fluide entre chaque frappe
            }
      }
    />
  );
}
