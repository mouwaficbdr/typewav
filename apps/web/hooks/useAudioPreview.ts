'use client';

/**
 * useAudioPreview — joue une séquence de démonstration audio.
 * Client Component justifié : Tone.js browser-only, state de lecture.
 * Spec : docs/specs/21-audio-value-prop.md
 */

import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useCallback, useState } from 'react';

const DEMO_SEQUENCE: Array<{
  char: string;
  wordIndex: number;
  delayMs: number;
}> = [
  { char: 't', wordIndex: 0, delayMs: 0 },
  { char: 'y', wordIndex: 0, delayMs: 150 },
  { char: 'p', wordIndex: 0, delayMs: 280 },
  { char: 'e', wordIndex: 0, delayMs: 420 },
  { char: 'w', wordIndex: 1, delayMs: 650 },
  { char: 'a', wordIndex: 1, delayMs: 780 },
  { char: 'v', wordIndex: 1, delayMs: 890 },
  { char: 't', wordIndex: 2, delayMs: 1100 },
  { char: 'y', wordIndex: 2, delayMs: 1230 },
  { char: 'p', wordIndex: 2, delayMs: 1350 },
  { char: 'e', wordIndex: 3, delayMs: 1550 },
];

export function useAudioPreview() {
  const { initialize, playNote } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const playPreview = useCallback(async () => {
    if (isPlaying) return;
    await initialize(); // contrainte navigateur : Tone.start() après clic utilisateur
    setIsPlaying(true);

    for (const note of DEMO_SEQUENCE) {
      await new Promise<void>((resolve) => setTimeout(resolve, note.delayMs));
      await playNote(note.char, note.wordIndex);
    }

    setIsPlaying(false);
    setHasPlayed(true);
  }, [isPlaying, initialize, playNote]);

  return { playPreview, isPlaying, hasPlayed };
}
