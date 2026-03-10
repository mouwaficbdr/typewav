'use client';

/**
 * TypingArea — zone de frappe principale.
 *
 * Client Component justifié : événements clavier, état interactif, Tone.js.
 * Spec : docs/ARCHITECTURE.md — Client Components ('use client')
 */

import { GhostCursor } from '@/components/typing/GhostCursor';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useSession } from '@/hooks/useSession';
import type { TypingMode } from '@typewav/types';
import { useCallback, useEffect, useRef } from 'react';

interface TypingAreaProps {
  text: string;
  mode?: TypingMode;
  collectionId?: string;
  /** Si false, ne navigue pas vers /results automatiquement (ex: LearningMode) */
  autoNavigate?: boolean;
  /** Callback : touche attendue actuellement (pour KeyboardDiagram) */
  onActiveKeyChange?: (key: string | undefined) => void;
  /** Timings inter-frappe du record personnel (ms) — active le ghost mode */
  ghostTimings?: number[];
  /** Callback appelé à la fin du test avec le WPM final (utile si autoNavigate=false) */
  onComplete?: (wpm: number) => void;
}

export function TypingArea({
  text,
  mode = 'classic',
  collectionId,
  autoNavigate = true,
  onActiveKeyChange,
  ghostTimings,
  onComplete,
}: TypingAreaProps) {
  const {
    position,
    keystrokes,
    liveStats,
    isComplete,
    handleKeystroke,
    handleBackspace,
  } = useSession({
    text,
    mode,
    ...(collectionId !== undefined ? { collectionId } : {}),
    autoNavigate,
  });
  const { initialize, playNote, triggerSilence, triggerResume } =
    useAudioEngine();

  const containerRef = useRef<HTMLDivElement>(null);

  // Focus automatique sur le conteneur au montage
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Notifier la touche actuellement attendue (pour KeyboardDiagram)
  useEffect(() => {
    if (!onActiveKeyChange) return;
    const expected = text[position];
    onActiveKeyChange(isComplete ? undefined : expected);
  }, [position, text, isComplete, onActiveKeyChange]);

  // Callback onComplete quand le test se termine
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete(liveStats.wpm);
    }
    // onComplete est stable — pas besoin de l'ajouter dans les deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, liveStats.wpm]);

  // Calcul du mot courant (pour l'accord musical)
  const wordIndex = text.slice(0, position).split(' ').length - 1;

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isComplete) return;

      // Initialiser Tone.js à la première frappe (contrainte navigateur)
      await initialize();

      if (e.key === 'Backspace') {
        handleBackspace();
        return;
      }

      if (e.key.length !== 1) return;

      const expected = text[position];
      const isCorrect = e.key === expected;

      handleKeystroke(e.key);

      if (isCorrect) {
        await playNote(e.key, wordIndex);
      } else {
        triggerSilence();
      }

      // Micro-reverb si c'est une correction (frappe juste après erreur)
      const prevKeystroke = keystrokes[keystrokes.length - 1];
      if (isCorrect && prevKeystroke && !prevKeystroke.correct) {
        await triggerResume();
      }
    },
    [
      position,
      text,
      keystrokes,
      isComplete,
      wordIndex,
      initialize,
      handleKeystroke,
      handleBackspace,
      playNote,
      triggerSilence,
      triggerResume,
    ],
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
      {/* Stats live */}
      <div
        className="flex gap-8 text-sm"
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span>
          <span
            style={{
              color: 'var(--color-accent)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(liveStats.wpm)}
          </span>{' '}
          WPM
        </span>
        <span>
          <span
            style={{
              color: 'var(--color-accent)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(liveStats.accuracy)}
          </span>
          % acc
        </span>
        <span>
          <span
            style={{
              color: 'var(--color-accent)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(liveStats.consistency)}
          </span>
          % const
        </span>
      </div>

      {/* Zone de frappe */}
      <div
        ref={containerRef}
        role="textbox"
        aria-label="Zone de frappe — tapez le texte affiché"
        aria-multiline="false"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative cursor-text select-none rounded-md p-8 focus:outline-none w-full"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.25rem',
          lineHeight: '2',
        }}
      >
        {/* Ghost cursor — mode ghost activé si ghostTimings fourni */}
        {ghostTimings && ghostTimings.length > 0 && (
          <GhostCursor
            ghostTimings={ghostTimings}
            userPosition={position}
            textLength={text.length}
          />
        )}
        <p
          aria-live="off"
          className="m-0 flex flex-wrap gap-0"
          data-testid="typing-area"
        >
          {text.split('').map((char, index) => {
            let state: string;
            if (index < position) {
              state = keystrokes[index]?.correct
                ? 'char-correct'
                : 'char-error';
            } else if (index === position) {
              state = 'char-current';
            } else {
              state = 'char-pending';
            }

            return (
              <span key={index} data-testid={`char-${index}`} className={state}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </p>

        {!isComplete && (
          <p
            className="absolute bottom-2 right-4 text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            cliquer pour activer · chaque frappe produit une note
          </p>
        )}
      </div>
    </div>
  );
}
