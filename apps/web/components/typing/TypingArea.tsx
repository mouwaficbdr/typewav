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
import { CorrectionEchoTracker } from '@/lib/correction-echo';
import { resetSequence } from '@typewav/audio-engine';
import type { TypingMode } from '@typewav/types';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** Hauteur de ligne fixe = 3.5rem à 16px base = 56px */
const LINE_HEIGHT_PX = 56;

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
   * Callback riche de fin de session (utile pour le mode Learning).
   */
  onSessionComplete?: (stats: {
    wpm: number;
    accuracy: number;
    correct: number;
    total: number;
  }) => void;
  /**
   * Callback appelé à chaque frappe — pilote WaveformBars et AmbientAura.
   * note = note réellement jouée (ou null si silence/erreur).
   * isPhraseBoundary = true si cette note marque la fin d'une phrase
   * musicale réelle (voir ParsedNote dans @typewav/audio-engine) : toujours
   * false si note est null.
   */
  onNoteChange?: (
    note: string | null,
    isError: boolean,
    isPhraseBoundary: boolean,
  ) => void;
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
  onSessionComplete,
  onNoteChange,
}: TypingAreaProps) {
  const {
    position,
    keystrokes,
    liveStats,
    finalStats,
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
  const completionNotifiedRef = useRef(false);
  const correctionEchoRef = useRef<CorrectionEchoTracker>(
    new CorrectionEchoTracker(),
  );
  const [isFocused, setIsFocused] = useState(false);
  const [translateY, setTranslateY] = useState(0);

  // Accessibilité : la zone de frappe est un widget d'interaction custom
  // (role="application"), pas un champ de texte. Un lecteur d'écran ne
  // parcourt donc pas son contenu ; on lui expose séparément les
  // instructions, le texte cible complet, et une région live discrète qui
  // annonce la progression aux paliers de 25 % plutôt qu'à chaque frappe.
  const instructionsId = useId();
  const [liveMessage, setLiveMessage] = useState('');
  const announcedBucketRef = useRef(0);

  const srPercent =
    text.length > 0
      ? Math.min(100, Math.max(0, Math.floor((position / text.length) * 100)))
      : 0;
  const srBucket =
    srPercent >= 100
      ? 100
      : srPercent >= 75
        ? 75
        : srPercent >= 50
          ? 50
          : srPercent >= 25
            ? 25
            : 0;

  useEffect(() => {
    if (isComplete) {
      if (announcedBucketRef.current === 100) return;
      announcedBucketRef.current = 100;
      setLiveMessage(
        t('srComplete', {
          wpm: Math.round(finalStats?.wpm ?? liveStats.wpm),
          accuracy: Math.round(finalStats?.accuracy ?? liveStats.accuracy),
        }),
      );
      return;
    }
    if (srBucket >= 25 && srBucket > announcedBucketRef.current) {
      announcedBucketRef.current = srBucket;
      setLiveMessage(
        t('srProgress', {
          percent: srPercent,
          wpm: Math.round(liveStats.wpm),
          accuracy: Math.round(liveStats.accuracy),
        }),
      );
    }
  }, [srBucket, srPercent, isComplete, finalStats, liveStats, t]);

  // Remettre le séquenceur MIDI à zéro pour chaque nouvelle tentative.
  // TypingArea remonte entièrement à chaque nouveau test (restart, shuffle,
  // changement de collection/pièce — via la key React côté HomeClient),
  // mais le séquenceur est un singleton de module qui, sans ce reset,
  // garde la position laissée par la tentative précédente.
  useEffect(() => {
    resetSequence();
  }, []);

  // Notifier la touche actuellement attendue (pour KeyboardDiagram)
  useEffect(() => {
    if (!onActiveKeyChange) return;
    const expected = text[position];
    onActiveKeyChange(isComplete ? undefined : expected);
  }, [position, text, isComplete, onActiveKeyChange]);

  // Callback(s) de fin quand le test se termine.
  // Attend finalStats plutôt que de lire liveStats.wpm : liveStats n'est
  // rafraîchi qu'au mieux toutes les 1s pendant la frappe, donc un exercice
  // qui se termine plus vite que ce premier tick (fréquent sur un texte
  // court) le laisserait à sa valeur initiale de 0.
  useEffect(() => {
    if (!isComplete) {
      completionNotifiedRef.current = false;
      return;
    }
    if (!finalStats) return;

    if (completionNotifiedRef.current) return;
    completionNotifiedRef.current = true;

    const total = keystrokes.length;
    const correct = keystrokes.filter((entry) => entry.correct).length;
    const accuracy = total === 0 ? 100 : (correct / total) * 100;

    onComplete?.(finalStats.wpm);
    onSessionComplete?.({
      wpm: finalStats.wpm,
      accuracy,
      correct,
      total,
    });
  }, [isComplete, finalStats, keystrokes, onComplete, onSessionComplete]);

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
    async (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isComplete) return;

      // Démarre l'initialisation audio (Tone.start() doit être appelé de
      // façon synchrone dans le keydown pour la contrainte navigateur) sans
      // jamais bloquer dessus : le curseur doit avancer sur CHAQUE frappe,
      // correcte ou incorrecte (invariant du produit, voir useSessionStore),
      // indépendamment du temps que prend le chargement du sampler
      // (plusieurs secondes à froid).
      const initPromise = initialize();

      if (e.key === 'Backspace') {
        correctionEchoRef.current.onBackspace(keystrokes[keystrokes.length - 1]);
        handleBackspace();
        await initPromise;
        return;
      }

      if (e.key.length !== 1) return;

      const expected = text[position];
      const isCorrect = e.key === expected;

      handleKeystroke(e.key);

      await initPromise;

      if (isCorrect) {
        const played = await playNote(e.key, wordIndex);
        onNoteChange?.(played?.note ?? null, false, played?.isPhraseBoundary ?? false);
      } else {
        triggerSilence();
        onNoteChange?.(null, true, false);
      }

      // Micro-reverb uniquement si cette frappe correcte complète une
      // correction amorcée par Backspace (pas juste "la frappe d'avant était fausse").
      if (correctionEchoRef.current.onKeystroke(isCorrect)) {
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

  // handleKeyDown change de référence à chaque frappe (deps de son
  // useCallback) — passer par un ref permet au listener natif ci-dessous de
  // toujours appeler la version courante sans avoir à se détacher/rattacher
  // à chaque frappe.
  const handleKeyDownRef = useRef(handleKeyDown);
  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  });

  // Écoute native (addEventListener) plutôt que les props React
  // onKeyDown/onFocus/onBlur. Constaté en session live (reproduit en dev ET
  // en build de prod, avec focus DOM/fenêtre confirmés corrects et les props
  // bien attachées aux internals React) : un keydown, même natif et fiable
  // au niveau DOM, n'atteignait jamais le dispatch synthétique de React
  // après un focus purement programmatique — un vrai clic le débloquait
  // systématiquement, un addEventListener natif posé directement sur le
  // conteneur aussi. Cause exacte non identifiée côté React ; on contourne
  // son système d'événements synthétique pour ce chemin critique plutôt que
  // de dépendre de lui.
  //
  // useLayoutEffect (pas useEffect), et les listeners posés AVANT
  // container.focus() : sinon le focus automatique au montage émet son
  // événement 'focus' natif avant que le listener ne soit attaché, et cet
  // évènement — non rejouable, un élément déjà focus ne réémet rien — est
  // perdu pour de bon (overlay "Cliquez pour activer" resté affiché à tort).
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onKeyDown = (e: KeyboardEvent) => {
      void handleKeyDownRef.current(e);
    };
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);

    container.addEventListener('keydown', onKeyDown);
    container.addEventListener('focus', onFocus);
    container.addEventListener('blur', onBlur);
    container.focus();

    return () => {
      container.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('focus', onFocus);
      container.removeEventListener('blur', onBlur);
    };
  }, []);

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
      {/* Instructions et texte cible, réservés aux technologies d'assistance.
          Hors du conteneur role="application" pour rester parcourables au
          curseur de révision d'un lecteur d'écran. */}
      <p id={instructionsId} className="sr-only">
        {t('ariaTypingInstructions')}
      </p>
      <p className="sr-only" data-testid="typing-target-text">
        {t('ariaTargetTextLabel')}: {text}
      </p>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="typing-live-region"
      >
        {liveMessage}
      </div>

      {/* Live stats overlay — Option A : au-dessus, opacity 0 avant la première frappe.
          Masqué en mode zen : « sans pression, sans timer » veut dire sans métrique
          affichée en direct non plus, sinon zen == quote avec juste un timer en moins.
          aria-hidden : ces chiffres sont annoncés via la région live ci-dessus,
          pas en double ici. */}
      {mode !== 'zen' && (
        <div
          data-testid="live-stats-overlay"
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
      )}

      {/* Zone de frappe — aérée, fluide, text muté pour l'attente.
          role="application" : widget d'interaction custom, force le passage
          des touches lettres au lieu de les laisser piloter les raccourcis
          de navigation du lecteur d'écran. Décrite par les instructions
          sr-only ci-dessus. */}
      <div
        ref={containerRef}
        role="application"
        aria-label={t('ariaTypingArea')}
        aria-describedby={instructionsId}
        tabIndex={0}
        className="typing-focus-ring cursor-text select-none w-full"
        style={{
          position: 'relative',
          height: `${LINE_HEIGHT_PX * 3}px`,
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
          fontSize: '2.25rem' /* Bumped up for ultimate focus */,
          fontWeight: 500, /* Slightly bolder */
          lineHeight: `${LINE_HEIGHT_PX}px`,
          letterSpacing: '-0.02em', /* Tighter letter spacing for modern dev aesthetic */
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
          aria-hidden="true"
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
