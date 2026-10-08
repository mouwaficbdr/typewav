'use client';

/**
 * Le test de placement (écran 9) : 30 secondes de mots fréquents en
 * minuscules, sur le morceau par défaut (chargé par ConservatoireClient). Les
 * frappes nourrissent le moteur de maîtrise ; la séance n'est ni sauvegardée
 * ni comptée.
 */

import { TypingArea } from '@/components/typing/TypingArea';
import { recordAttempt } from '@/lib/conservatoire/mastery';
import { loadMastery, saveMastery } from '@/lib/conservatoire/storage';
import { WORDS_FR_PLAIN } from '@/lib/learning-texts';
import type { Mastery, PlacementResult } from '@typewav/types';
import { useEffect, useRef, useState } from 'react';

export const PLACEMENT_SECONDS = 30;

/** Les mots, mélangés (Fisher-Yates) et joints par des espaces. */
export function placementText(
  words: readonly string[],
  random: () => number = Math.random,
): string {
  const pool = [...words];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.join(' ');
}

export function PlacementTest({ onDone }: { onDone: (result: PlacementResult) => void }) {
  const [text] = useState(() => placementText(WORDS_FR_PLAIN));
  const masteryRef = useRef<Mastery>({});
  const previousAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMastery().then(({ mastery }) => {
      // Si une frappe est déjà passée, elle a commencé sur une maîtrise vide :
      // on la garde (la lecture prend quelques millisecondes).
      if (!cancelled && previousAtRef.current === null) masteryRef.current = mastery;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TypingArea
      text={text}
      mode="classic"
      durationSeconds={PLACEMENT_SECONDS}
      autoNavigate={false}
      trackProgress={false}
      onAttempt={(a) => {
        masteryRef.current = recordAttempt(masteryRef.current, a, previousAtRef.current);
        previousAtRef.current = a.at;
      }}
      onSessionComplete={(stats) => {
        void saveMastery(masteryRef.current);
        onDone({ wpm: Math.round(stats.wpm), accuracy: Math.round(stats.accuracy) });
      }}
    />
  );
}
