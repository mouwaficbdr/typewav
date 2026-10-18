'use client';

import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useReducedMotion } from 'motion/react';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  HOME_ROW_CODES,
  HOME_ROW_NOTES,
  homeRowLabel,
  type HomeRowCode,
} from './home-row';

const RIPPLE_MS = 600;
const PRESS_MS = 150;

function isHomeRowCode(code: string): code is HomeRowCode {
  return (HOME_ROW_CODES as readonly string[]).includes(code);
}

/**
 * HomeRowTeaser : avant-goût jouable de la rangée de repos, sur la page
 * « à venir » du Conservatoire.
 *
 * Huit touches dessinées, une par doigt. Une des huit joue sa note au piano
 * et lance une onde `--color-accent` ; toute autre touche ne joue jamais de
 * note nouvelle, seulement l'écho de la dernière (comme une faute dans
 * l'app). `data-ripple-count` sur la racine compte les notes jouées.
 */
export function HomeRowTeaser() {
  const { initialize, playNoteName, triggerSilence } = useAudioEngine();
  const locale = useLocale();
  const reduceMotion = useReducedMotion() === true;

  const [layout, setLayout] = useState<'azerty' | 'qwerty'>(
    locale === 'fr' ? 'azerty' : 'qwerty',
  );
  const [rippleCount, setRippleCount] = useState(0);
  const [rippleKey, setRippleKey] = useState<{
    code: HomeRowCode;
    id: number;
  } | null>(null);
  const [pressedCode, setPressedCode] = useState<HomeRowCode | null>(null);
  const rippleIdRef = useRef(0);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
    },
    [],
  );

  const press = (code: HomeRowCode) => {
    setPressedCode(code);
    if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    pressTimeoutRef.current = setTimeout(
      () => setPressedCode(null),
      PRESS_MS,
    );
  };

  const trigger = async (code: HomeRowCode) => {
    press(code);
    const id = ++rippleIdRef.current;
    setRippleKey({ code, id });
    if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
    rippleTimeoutRef.current = setTimeout(() => {
      setRippleKey((current) => (current?.id === id ? null : current));
    }, RIPPLE_MS);

    const initPromise = initialize();
    await initPromise;
    await playNoteName(HOME_ROW_NOTES[code]);
    setRippleCount((n) => n + 1);
  };

  useEffect(() => {
    // Exception documentée à la règle `commitChar` (voir TypingArea) : ici
    // rien n'est composé, `code` identifie directement une touche physique.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === 'KeyA') {
        if (e.key === 'a') setLayout('qwerty');
        else if (e.key === 'q') setLayout('azerty');
      }

      if (isHomeRowCode(e.code)) {
        void trigger(e.code);
      } else {
        void triggerSilence();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSilence]);

  return (
    <div data-ripple-count={rippleCount} style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
      >
        {HOME_ROW_CODES.map((code, i) => {
          const isRippling = !reduceMotion && rippleKey?.code === code;
          const isPressed = reduceMotion && pressedCode === code;
          return (
            <button
              key={code}
              type="button"
              data-testid={`home-row-key-${code}`}
              data-pressed={isPressed ? 'true' : undefined}
              onPointerDown={() => void trigger(code)}
              style={{
                position: 'relative',
                flex: '1 1 0',
                height: 'clamp(48px, 8vw, 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                border: 'none',
                borderLeft:
                  i === 0 ? 'none' : '1px solid var(--color-border)',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transform: isPressed ? 'scale(0.94)' : 'scale(1)',
                transition: 'transform 0.12s ease-out',
                overflow: 'hidden',
              }}
            >
              {homeRowLabel(code, layout)}
              {isRippling && (
                <span
                  data-ripple
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    opacity: 0.35,
                    animation: `home-row-ripple ${RIPPLE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes home-row-ripple {
          from { transform: scale(0.2); opacity: 0.45; }
          to { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
