'use client';

/**
 * TypingArea — zone de frappe principale.
 *
 * Client Component justifié : événements clavier, état interactif, Tone.js.
 * Spec : docs/ARCHITECTURE.md — Client Components ('use client')
 *
 * Refonte spec-29 :
 * - Aucune boîte (no bg, no border) — texte flottant sur fond.
 * - 3 lignes visibles, scroll translateY par ligne active.
 * - Live stats overlay Option A (au-dessus, opacity 0→0.45 après première frappe).
 * - WaveformBars extrait : onNoteChange pilote Zone 5 de HomeClient.
 */

import { GhostCursor } from '@/components/typing/GhostCursor';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useSession } from '@/hooks/useSession';
import type { TypingMode } from '@typewav/types';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** Hauteur de ligne fixe = 3rem à 16px base = 48px */
const LINE_HEIGHT_PX = 48;

interface TypingAreaProps {
  text: string;
  mode?: TypingMode;
  collectionId?: string;
  durationSeconds?: number;
  /** Si false, ne navigue pas vers /results automatiquement (ex: LearningMode) */
  autoNavigate?: boolean;
  /** Callback : touche attendue actuellement (pour KeyboardDiagram) */
  onActiveKeyChange?: (key: string | undefined) => void;
  /** Timings inter-frappe du record personnel (ms) — active le ghost mode */
  ghostTimings?: number[];
  /** Callback appelé à la fin du test avec le WPM final (utile si autoNavigate=false) */
  onComplete?: (wpm: number) => void;
  /**
   * Callback appelé à chaque frappe — pilote WaveformBars en Zone 5.
   * note = touche pressée (truthy) ou null si silence/erreur.
   */
  onNoteChange?: (note: string | null, isError: boolean) => void;
}

export function TypingArea({
  text,
  mode = 'classic',
  collectionId,
  durationSeconds,
  autoNavigate = true,
  onActiveKeyChange,
  ghostTimings,
  onComplete,
  onNoteChange,
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
    ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    autoNavigate,
  });
  const { initialize, playNote, triggerSilence, triggerResume } =
    useAudioEngine();
  const t = useTranslations('typing');

  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLParagraphElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [translateY, setTranslateY] = useState(0);

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

  // Scroll 3 lignes — translateY calculé via getBoundingClientRect
  // Note : spanRect.top - wordsRect.top est indépendant du transform appliqué
  // (les deux rects sont décalés par le même translateY → différence = offset naturel).
  useLayoutEffect(() => {
    if (!wordsRef.current) return;
    const spans = wordsRef.current.getElementsByTagName('span');
    const currentSpan = spans[position];
    if (!currentSpan) return;

    const wordsRect = wordsRef.current.getBoundingClientRect();
    const spanRect = currentSpan.getBoundingClientRect();
    const naturalRelTop = spanRect.top - wordsRect.top;
    const currentLine = Math.floor(Math.round(naturalRelTop) / LINE_HEIGHT_PX);
    const newTranslate = -Math.max(0, currentLine - 1) * LINE_HEIGHT_PX;

    setTranslateY(newTranslate);
  }, [position]);

  // Dérive l'état visuel de chaque caractère en rejouant les frappes.
  // Le curseur avance à chaque frappe, donc l'index suit toujours l'ordre des saisies.
  const charStates = useMemo(() => {
    const states = Array.from({ length: text.length }, () => 'char-pending');
    let cursor = 0;

    for (const stroke of keystrokes) {
      if (cursor >= text.length) break;
      states[cursor] = stroke.correct ? 'char-correct' : 'char-error';
      cursor += 1;
    }

    if (cursor < text.length) {
      states[cursor] = 'char-current';
    }

    return states;
  }, [keystrokes, text]);

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
        onNoteChange?.(e.key, false);
      } else {
        triggerSilence();
        onNoteChange?.(null, true);
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
      onNoteChange,
    ],
  );

  return (
    <div
      className="content-typing"
      style={{
        position: 'relative',
        opacity: isComplete ? 0 : 1,
        transform: isComplete ? 'translateY(10px)' : 'translateY(0)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Live stats overlay — Option A : au-dessus, opacity 0 avant la première frappe */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-1.75rem',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: position === 0 ? 0 : 0.45,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          transition: 'opacity 0.3s',
          letterSpacing: '0.04em',
          userSelect: 'none',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            color: 'var(--color-accent)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(liveStats.wpm)}
        </span>
        {' wpm · '}
        <span
          style={{
            color: 'var(--color-accent)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(liveStats.accuracy)}
        </span>
        {'% acc'}
      </div>

      {/* Zone de frappe — aérée, fluide, text muté pour l'attente */}
      <div
        ref={containerRef}
        role="textbox"
        aria-label={t('hint')}
        aria-multiline="false"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="cursor-text select-none w-full"
        style={{
          position: 'relative',
          height: `${LINE_HEIGHT_PX * 3}px`,
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.75rem' /* MonkeyType scale */,
          lineHeight: `${LINE_HEIGHT_PX}px`,
          letterSpacing: '0.02em',
          outline: 'none', // Remove browser focus ring
        }}
      >
        {ghostTimings && ghostTimings.length > 0 && (
          <GhostCursor
            ghostTimings={ghostTimings}
            textLength={text.length}
            wordsRef={wordsRef}
          />
        )}

        {/* Focus Overlay — Seamless glass effect */}
        <div
          aria-hidden="true"
          data-testid="typing-activation-overlay"
          style={{
            position: 'absolute',
            inset: -20, // stretch over edges for cleaner blur
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'color-mix(in srgb, var(--color-bg) 75%, transparent)',
            zIndex: 1,
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
            opacity: !isFocused && !isComplete ? 1 : 0,
            transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              letterSpacing: '0.05em',
              fontWeight: 500,
            }}
          >
            {t('clickToFocus')}
          </span>
        </div>

        {/* Conteneur des mots — scroll par translateY, transition ultra douce */}
        <div
          ref={wordsRef}
          aria-live="off"
          className="m-0 flex flex-wrap"
          data-testid="typing-area"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
            userSelect: 'none',
            columnGap: '0.6em',
            justifyContent: mode === 'learning' ? 'center' : 'flex-start',
            rowGap: '0',
          }}
        >
          {(() => {
            let globalIndex = 0;
            return text.split(' ').map((wordStr, wIndex, arr) => {
              const isLastWord = wIndex === arr.length - 1;
              const chars = wordStr.split('');

              const wordNode = (
                <div
                  key={`word-${wIndex}`}
                  className="word"
                  style={{ display: 'flex' }}
                >
                  {chars.map((char) => {
                    const index = globalIndex++;
                    const state = charStates[index] ?? 'char-pending';

                    return (
                      <span
                        key={`char-${index}`}
                        data-testid={`char-${index}`}
                        className={state}
                      >
                        {char}
                      </span>
                    );
                  })}

                  {/* Space element at the end of the word */}
                  {!isLastWord &&
                    (() => {
                      const spaceIndex = globalIndex++;
                      const spaceState =
                        charStates[spaceIndex] ?? 'char-pending';

                      return (
                        <span
                          key={`char-${spaceIndex}`}
                          data-testid={`char-${spaceIndex}`}
                          className={`${spaceState} char-space`}
                          style={{
                            /* Render an actual space if needed for current focus, but we let columnGap do the spacing. 
                             Setting width:0 ensures it doesn't add double spacing, but it exists in DOM for bounding rect. */
                            width: spaceIndex === position ? '0.4em' : '0px',
                            display: 'inline-block',
                            color: 'transparent',
                          }}
                        >
                          {spaceIndex === position ? '_' : ''}
                        </span>
                      );
                    })()}
                </div>
              );

              return wordNode;
            });
          })()}
        </div>
      </div>
    </div>
  );
}
