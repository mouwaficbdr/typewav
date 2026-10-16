'use client';

/**
 * LivingKeyboard : le clavier vivant du Conservatoire (spec partie 2).
 * - R4 : le clavier reste neutre, seule la cible prend la couleur de son
 *   doigt, et le nom du doigt s'écrit dessous.
 * - R3 : `ripple(code)` lance une onde « goutte d'eau » de la couleur du
 *   doigt, dessinée dans un canvas au-dessus des touches, sans aucune
 *   écriture DOM par touche ; la boucle rAF ne tourne que tant qu'un anneau
 *   vit.
 * - R6 : sous mouvement réduit, pas de canvas, la touche s'enfonce.
 * Attributs de test : `data-code`, `data-target` (`full` ou `faint`),
 * `data-bump`, `data-pressed`, et `data-ripple-count` sur la racine.
 */

import { FINGER_COLORS } from '@/components/modes/finger-colors';
import { KEYBOARD_VIEW, PHYSICAL_KEYS, keyByCode } from '@/lib/conservatoire/physical-keys';
import type { KeyboardLayout } from '@/lib/keyboardLayouts';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';

export interface LivingKeyboardHandle {
  ripple: (code: string) => void;
}

export interface LivingKeyboardProps {
  layout: KeyboardLayout;
  /** `code` physique de la touche attendue. */
  target?: string;
  targetStyle?: 'full' | 'faint';
  /** Cible cachée tant que ce délai n'est pas écoulé, puis montrée en contour. */
  hintAfterMs?: number;
  ref?: Ref<LivingKeyboardHandle>;
}

const RING_MS = 1150;
const RINGS = [
  { delay: 0, alpha: 0.5, width: 1.5 },
  { delay: 140, alpha: 0.28, width: 1 },
] as const;
const WAVE_LIFE_MS = RING_MS + RINGS[1].delay;
const PRESS_MS = 120;
/** Rayon de départ : le quart de la touche. */
const START_RADIUS = 7;
/** Demi-épaisseur du front d'onde qui teinte un contour au passage. */
const FRONT = 16;

// ponytail: exponentielle à la place d'un solveur de cubic-bezier(0.16, 1,
// 0.3, 1) ; indiscernable à l'œil, à remplacer si la courbe doit être exacte.
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

interface Wave {
  x: number;
  y: number;
  color: string;
  start: number;
}

function farthestCorner(x: number, y: number): number {
  const { width, height } = KEYBOARD_VIEW;
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  );
}

export function LivingKeyboard({
  layout,
  target,
  targetStyle = 'full',
  hintAfterMs,
  ref,
}: LivingKeyboardProps) {
  const t = useTranslations('conservatoire');
  const tTyping = useTranslations('typing');
  const reduceMotion = useReducedMotion() === true;
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesRef = useRef<Wave[]>([]);
  const handlesRef = useRef<{
    frame: number | null;
    press: ReturnType<typeof setTimeout> | null;
  }>({ frame: null, press: null });
  const [pressed, setPressed] = useState<string | null>(null);
  const [hintFor, setHintFor] = useState<string | null>(null);

  useEffect(() => {
    if (hintAfterMs === undefined || target === undefined) return;
    const id = setTimeout(() => setHintFor(target), hintAfterMs);
    return () => clearTimeout(id);
  }, [target, hintAfterMs]);

  useEffect(() => {
    const handles = handlesRef.current;
    return () => {
      if (handles.frame !== null) cancelAnimationFrame(handles.frame);
      if (handles.press !== null) clearTimeout(handles.press);
    };
  }, []);

  const draw = useCallback(function draw(now: number) {
    const handles = handlesRef.current;
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !svg || !ctx) {
      wavesRef.current = [];
      handles.frame = null;
      return;
    }
    const rect = svg.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    // viewBox en « meet » : échelle uniforme, contenu centré dans la boîte.
    const scale = Math.min(rect.width / KEYBOARD_VIEW.width, rect.height / KEYBOARD_VIEW.height);
    const ox = (rect.width - KEYBOARD_VIEW.width * scale) / 2;
    const oy = (rect.height - KEYBOARD_VIEW.height * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    wavesRef.current = wavesRef.current.filter((wave) => now - wave.start < WAVE_LIFE_MS);
    for (const wave of wavesRef.current) {
      const maxRadius = farthestCorner(wave.x, wave.y);
      ctx.strokeStyle = wave.color;
      for (const ring of RINGS) {
        const progress = (now - wave.start - ring.delay) / RING_MS;
        if (progress <= 0 || progress >= 1) continue;
        const radius = START_RADIUS + (maxRadius - START_RADIUS) * easeOutExpo(progress);
        const alpha = ring.alpha * (1 - progress);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = ring.width / scale;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (ring.delay !== 0) continue; // seul le premier anneau teinte les contours
        for (const key of PHYSICAL_KEYS) {
          const d = Math.hypot(key.x + key.w / 2 - wave.x, key.y + key.h / 2 - wave.y);
          if (Math.abs(d - radius) < FRONT) ctx.strokeRect(key.x, key.y, key.w, key.h);
        }
      }
    }
    ctx.globalAlpha = 1;
    handles.frame = wavesRef.current.length > 0 ? requestAnimationFrame(draw) : null;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      ripple(code: string) {
        const key = keyByCode(code);
        const root = rootRef.current;
        if (!key || !root) return;
        root.dataset.rippleCount = String(Number(root.dataset.rippleCount ?? '0') + 1);
        const handles = handlesRef.current;
        if (reduceMotion) {
          setPressed(code);
          if (handles.press !== null) clearTimeout(handles.press);
          handles.press = setTimeout(() => setPressed(null), PRESS_MS);
          return;
        }
        if (!canvasRef.current?.getContext('2d')) return;
        wavesRef.current.push({
          x: key.x + key.w / 2,
          y: key.y + key.h / 2,
          color: FINGER_COLORS[key.finger],
          start: performance.now(),
        });
        if (handles.frame === null) handles.frame = requestAnimationFrame(draw);
      },
    }),
    [reduceMotion, draw],
  );

  const targetVisible =
    target !== undefined && (hintAfterMs === undefined || hintFor === target);
  const shownStyle = hintAfterMs === undefined ? targetStyle : 'faint';
  const targetKey = targetVisible ? keyByCode(target) : undefined;

  return (
    <div
      ref={rootRef}
      data-living-keyboard
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${KEYBOARD_VIEW.width} ${KEYBOARD_VIEW.height}`}
          role="img"
          aria-label={t('keyboard')}
          style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '42vh' }}
        >
          {PHYSICAL_KEYS.map((key) => {
            const isTarget = targetKey?.code === key.code;
            const filled = isTarget && shownStyle === 'full';
            const color = FINGER_COLORS[key.finger];
            const isPressed = pressed === key.code;
            return (
              <g
                key={key.code}
                data-code={key.code}
                {...(isTarget ? { 'data-target': shownStyle } : {})}
                {...(isPressed ? { 'data-pressed': 'true' } : {})}
                className={filled ? 'lk-breathe' : undefined}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transform: isPressed ? 'scale(0.94)' : 'none',
                  transition: `transform ${PRESS_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                }}
              >
                <rect
                  x={key.x}
                  y={key.y}
                  width={key.w}
                  height={key.h}
                  rx={5}
                  fill={filled ? color : 'var(--color-surface)'}
                  stroke={isTarget ? color : 'var(--color-border)'}
                  strokeWidth={isTarget ? 1.5 : 1}
                />
                <text
                  key={layout}
                  className={reduceMotion ? undefined : 'lk-label-fade'}
                  x={key.x + key.w / 2}
                  y={key.y + key.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                  fill={filled ? 'var(--color-bg)' : 'var(--color-text-muted)'}
                >
                  {key.labels[layout]}
                </text>
                {key.bump && (
                  <line
                    data-bump="true"
                    x1={key.x + key.w / 2 - 4}
                    y1={key.y + key.h - 5}
                    x2={key.x + key.w / 2 + 4}
                    y2={key.y + key.h - 5}
                    stroke={filled ? 'var(--color-bg)' : 'var(--color-text-muted)'}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </svg>
        {!reduceMotion && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        )}
      </div>
      <p
        style={{
          margin: 0,
          minHeight: '1.4em',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          color: targetKey ? FINGER_COLORS[targetKey.finger] : 'var(--color-text-muted)',
        }}
      >
        {targetKey ? tTyping(`finger.${targetKey.finger}`) : ''}
      </p>
    </div>
  );
}
