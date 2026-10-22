'use client';

import { Keycap } from '@/components/ui/Keycap';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useHiddenCapture } from '@/hooks/useHiddenCapture';
import { useAudioStore } from '@/stores/useAudioStore';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { INTRO_MELODY, playChord } from '../intro-music';
import { INITIAL_PLAY, playStep, type PlayState } from '../play-reducer';
import { Staff, type StaffHead } from '../Staff';

interface PlayScreenProps {
  onDone: () => void;
  touch: boolean;
}

/**
 * Écran 2 : joue (spec partie B). Le moment où la valeur se prouve. Capture
 * par `useHiddenCapture`, jamais de listener de texte sur `keydown` ; Retour
 * arrière lu sur `keydown`, comme `TypingArea`.
 */
export function PlayScreen({ onDone, touch }: PlayScreenProps) {
  const t = useTranslations('intro');
  const text = t('play.text');
  const { playNoteName, triggerErrorEcho, triggerResume } = useAudioEngine();
  const isSamplerLoaded = useAudioStore((s) => s.isSamplerLoaded);

  const [playState, setPlayState] = useState<PlayState>(INITIAL_PLAY);
  const [heads, setHeads] = useState<StaffHead[]>([]);
  const [touchCount, setTouchCount] = useState(0);
  const headIdRef = useRef(0);

  // Ref, pas seulement le state : deux frappes dans la même tâche (frappe
  // très rapide) doivent s'enchaîner sur le vrai dernier état, pas sur une
  // fermeture figée avant le prochain rendu.
  const playStateRef = useRef(playState);

  const applyEffect = useCallback(
    (effect: ReturnType<typeof playStep>['effect'], wasAskMiss: boolean) => {
      if (!effect) return;
      if (effect.kind === 'note') {
        const notes = INTRO_MELODY[effect.index] ?? [];
        void playChord(notes, playNoteName, () => isSamplerLoaded);
        setHeads((prev) => [
          ...prev,
          ...notes.map(() => ({ id: `h${headIdRef.current++}` })),
        ]);
      } else if (effect.kind === 'echo') {
        void triggerErrorEcho();
        if (wasAskMiss) {
          setHeads((prev) => prev.map((h) => ({ ...h, faded: true })));
        }
      } else if (effect.kind === 'resume') {
        void triggerResume();
        const notes = INTRO_MELODY[8] ?? [];
        void playChord(notes, playNoteName, () => isSamplerLoaded);
        setHeads(notes.map(() => ({ id: `h${headIdRef.current++}` })));
      }
    },
    [playNoteName, triggerErrorEcho, triggerResume, isSamplerLoaded],
  );

  const processChar = useCallback(
    (char: string) => {
      const wasAskMiss = playStateRef.current.phase === 'askMiss';
      const { state, effect } = playStep(
        playStateRef.current,
        { kind: 'char', char },
        text,
      );
      playStateRef.current = state;
      setPlayState(state);
      applyEffect(effect, wasAskMiss);
    },
    [text, applyEffect],
  );

  const { containerRef, inputRef } = useHiddenCapture(processChar);

  // Retour arrière, comme TypingArea : jamais de texte sur keydown, mais le
  // retour arrière n'est pas un caractère composé, il se lit directement ici.
  useEffect(() => {
    if (touch) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        const wasAskMiss = playStateRef.current.phase === 'askMiss';
        const { state, effect } = playStep(
          playStateRef.current,
          { kind: 'backspace' },
          text,
        );
        playStateRef.current = state;
        setPlayState(state);
        applyEffect(effect, wasAskMiss);
        return;
      }
      if (
        playStateRef.current.phase === 'resumed' &&
        (e.key === ' ' || e.key === 'Enter')
      ) {
        e.preventDefault();
        onDone();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [touch, text, applyEffect, onDone]);

  const handleTouchTap = useCallback(() => {
    if (touchCount >= INTRO_MELODY.length) {
      onDone();
      return;
    }
    const notes = INTRO_MELODY[touchCount] ?? [];
    void playChord(notes, playNoteName, () => isSamplerLoaded);
    setHeads((prev) => [
      ...prev,
      ...notes.map(() => ({ id: `h${headIdRef.current++}` })),
    ]);
    setTouchCount((n) => n + 1);
  }, [touchCount, playNoteName, isSamplerLoaded, onDone]);

  const touchDone = touch && touchCount >= INTRO_MELODY.length;

  return (
    <div
      data-part="play-screen"
      data-play-phase={touch ? undefined : playState.phase}
      style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
        }}
      >
        {touch ? t('play.touchInstruction') : t('play.instruction')}
      </p>

      {!touch && (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(2.8rem, 7.5vw, 4.6rem)',
            letterSpacing: '0.01em',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
          {playState.phase === 'typing' || playState.phase === 'askMiss' ? (
            [...text].map((char, i) => (
              <span
                key={i}
                className={
                  i < playState.typed
                    ? 'char-correct'
                    : i === playState.typed
                      ? 'char-current'
                      : 'char-pending'
                }
              >
                {char}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--color-text-primary)' }}>
              {playState.phase === 'waiting' ? t('play.waiting') : text}
            </span>
          )}
        </div>
      )}

      {touch && (
        <button
          type="button"
          data-testid="play-touch-surface"
          onClick={handleTouchTap}
          className="touch-manipulation hover:opacity-70 transition-opacity"
          style={{
            position: 'relative',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(2.8rem, 7.5vw, 4.6rem)',
            color: 'var(--color-text-primary)',
          }}
        >
          {touchDone ? t('play.touchMissLine') : text}
        </button>
      )}

      {!touch && playState.phase === 'askMiss' && (
        <p
          className="intro-pulse"
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.95rem',
            color: 'var(--color-text-primary)',
          }}
        >
          {t('play.askMiss')}
        </p>
      )}

      {/* L'explication reste neutre (pourquoi la musique s'est arrêtée) ;
          l'action à mener (resumeAction) est un élément distinct, au même
          style que les indications « continuer » du reste de l'Ouverture,
          et pulse pour ne jamais se confondre avec du texte d'ambiance. */}
      {!touch && (playState.phase === 'waiting' || playState.phase === 'resumed') && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('play.missLine')}
        </p>
      )}

      {!touch && playState.phase === 'waiting' && (
        <p
          data-part="play-resume-action"
          className="intro-pulse"
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-accent)',
          }}
        >
          <Keycap size="sm">⌫</Keycap>
          {t('play.resumeAction')}
        </p>
      )}

      {!touch && playState.phase === 'resumed' && (
        <p
          className="intro-pulse"
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}
        >
          <Keycap size="sm">{t('keySpace')}</Keycap>
          {t('continue')}
        </p>
      )}

      {touchDone && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('continueTouch')}
        </p>
      )}

      <Staff step={2} heads={heads} trailLength={INTRO_MELODY.length} />
    </div>
  );
}
