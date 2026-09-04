'use client';

/**
 * ScrambleText : révèle un texte par décodage progressif (effet « scramble »).
 *
 * `enabled={false}` : rend le texte tel quel, sans effet. Le texte reste
 * lisible dès le premier paint dans tous les cas (l'état initial EST le texte
 * final) : sur la page profil, ce composant porte le rang, l'identité de la
 * page ne doit jamais disparaître le temps d'une animation.
 */

import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function ScrambleText({
  text,
  enabled = false,
  delay = 0,
  duration = 900,
}: {
  text: string;
  enabled?: boolean;
  delay?: number;
  duration?: number;
}) {
  const [scrambled, setScrambled] = useState(text);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hors effet « scramble », le texte affiché est dérivé, pas un state :
  // aucun setState synchrone dans l'effet.
  const displayText = enabled ? scrambled : text;

  useEffect(() => {
    if (!enabled) return;

    const totalFrames = Math.max(1, duration / 30);
    timeoutRef.current = setTimeout(() => {
      let frame = 0;
      intervalRef.current = setInterval(() => {
        frame += 1;
        const progress = frame / totalFrames;
        if (progress >= 1) {
          setScrambled(text);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        const revealed = Math.floor(text.length * progress);
        setScrambled(
          text
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (i < revealed) return char;
              return CHARS[Math.floor(Math.random() * CHARS.length)] ?? char;
            })
            .join(''),
        );
      }, 30);
    }, delay * 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, enabled, delay, duration]);

  return <span>{displayText}</span>;
}
