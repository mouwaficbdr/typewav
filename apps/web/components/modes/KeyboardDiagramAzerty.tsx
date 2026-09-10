'use client';

/**
 * KeyboardDiagramAzerty : schéma clavier natif AZERTY (positions ET libellés),
 * dédié au parcours Apprentissage piloté par curriculum. Cinq rangées : chiffres,
 * haut, repos, bas, modificateurs (Maj gauche/droite + espace). Le
 * `KeyboardDiagram` QWERTY reste en service pour le chemin QWERTY
 * (`LegacyLearningMode`).
 *
 * Purement présentationnel : aucun hook, aucune i18n (les libellés SONT les
 * caractères AZERTY). Les états sont exposés en attributs `data-*` sur le `<g>` de
 * chaque touche, pour que les composants appelants et les tests s'y accrochent :
 *   data-highlight="true"  touche d'un nouveau geste du niveau (fond = couleur du doigt)
 *   data-active="true"     geste attendu courant (pulse)
 *   data-hold="true"       touche Maj à maintenir (auriculaire de la main opposée)
 */

import {
  DEAD_KEYS,
  LEARNING_CURRICULUM_AZERTY,
  type CurriculumKey,
  type FingerId,
} from '@typewav/types';
import { FINGER_COLORS } from './finger-colors';

export interface KeyboardDiagramAzertyProps {
  /** Gestes à surligner (typiquement les `newKeys` du niveau). */
  highlightKeys?: CurriculumKey[];
  /** Geste attendu courant (drill / étape d'enseignement) : un id de geste. */
  activeKeyId?: string;
  /** Geste `layer: 'shift'` : quelle main tient Maj ('L' | 'R', opposée à la lettre). */
  expectedShiftHand?: 'L' | 'R';
  /** Geste `layer: 'deadkey'` : 1 = touche morte (^ / ¨), 2 = la voyelle. */
  deadKeyStep?: 1 | 2;
}

// ─── Table du clavier physique AZERTY ─────────────────────────────────────────
// `id` sert d'identifiant `data-key`. Touche ordinaire : le caractère de base.
// Modificateurs : 'ShiftLeft' / 'ShiftRight' / 'Space'.

interface DiagramKey {
  id: string;
  label: string;
  /** Exposant en haut à droite du capuchon (chiffre de la rangée num., ¨ sur ^). */
  sup?: string;
  finger: FingerId;
  x: number;
  y: number;
  w: number;
  h: number;
}

const KEY_W = 28;
const KEY_H = 28;
const PITCH = 32;
const ROW_Y = { digits: 4, top: 36, home: 68, bottom: 100, mod: 132 } as const;

function row(
  y: number,
  xStart: number,
  entries: { id: string; label?: string; sup?: string; finger: FingerId }[],
): DiagramKey[] {
  return entries.map((e, i) => ({
    id: e.id,
    label: e.label ?? e.id,
    ...(e.sup !== undefined ? { sup: e.sup } : {}),
    finger: e.finger,
    x: xStart + i * PITCH,
    y,
    w: KEY_W,
    h: KEY_H,
  }));
}

const DIGIT_ROW = row(ROW_Y.digits, 0, [
  { id: '²', finger: 'LP' },
  { id: '&', sup: '1', finger: 'LP' },
  { id: 'é', sup: '2', finger: 'LR' },
  { id: '"', sup: '3', finger: 'LM' },
  { id: "'", sup: '4', finger: 'LI' },
  { id: '(', sup: '5', finger: 'LI' },
  { id: '-', sup: '6', finger: 'RI' },
  { id: 'è', sup: '7', finger: 'RI' },
  { id: '_', sup: '8', finger: 'RM' },
  { id: 'ç', sup: '9', finger: 'RR' },
  { id: 'à', sup: '0', finger: 'RP' },
  { id: ')', finger: 'RP' },
  { id: '=', finger: 'RP' },
]);

const TOP_ROW = row(ROW_Y.top, 8, [
  { id: 'a', finger: 'LP' },
  { id: 'z', finger: 'LR' },
  { id: 'e', finger: 'LM' },
  { id: 'r', finger: 'LI' },
  { id: 't', finger: 'LI' },
  { id: 'y', finger: 'RI' },
  { id: 'u', finger: 'RI' },
  { id: 'i', finger: 'RM' },
  { id: 'o', finger: 'RR' },
  { id: 'p', finger: 'RP' },
  { id: '^', sup: '¨', finger: 'RP' },
  { id: '$', finger: 'RP' },
]);

const HOME_ROW = row(ROW_Y.home, 16, [
  { id: 'q', finger: 'LP' },
  { id: 's', finger: 'LR' },
  { id: 'd', finger: 'LM' },
  { id: 'f', finger: 'LI' },
  { id: 'g', finger: 'LI' },
  { id: 'h', finger: 'RI' },
  { id: 'j', finger: 'RI' },
  { id: 'k', finger: 'RM' },
  { id: 'l', finger: 'RR' },
  { id: 'm', finger: 'RP' },
  { id: 'ù', finger: 'RP' },
  { id: '*', finger: 'RP' },
]);

const BOTTOM_ROW = row(ROW_Y.bottom, 24, [
  { id: 'w', finger: 'LP' },
  { id: 'x', finger: 'LR' },
  { id: 'c', finger: 'LM' },
  { id: 'v', finger: 'LI' },
  { id: 'b', finger: 'LI' },
  { id: 'n', finger: 'RI' },
  { id: ',', finger: 'RI' },
  { id: ';', finger: 'RM' },
  { id: ':', finger: 'RR' },
  { id: '!', finger: 'RP' },
]);

const MOD_ROW: DiagramKey[] = [
  { id: 'ShiftLeft', label: 'Maj', finger: 'LP', x: 0, y: ROW_Y.mod, w: 72, h: KEY_H },
  { id: 'Space', label: '', finger: 'RT', x: 150, y: ROW_Y.mod, w: 140, h: KEY_H },
  { id: 'ShiftRight', label: 'Maj', finger: 'RP', x: 330, y: ROW_Y.mod, w: 82, h: KEY_H },
];

const ALL_KEYS: DiagramKey[] = [
  ...DIGIT_ROW,
  ...TOP_ROW,
  ...HOME_ROW,
  ...BOTTOM_ROW,
  ...MOD_ROW,
];

// ─── Résolution geste -> position physique ────────────────────────────────────

const GESTURE_BY_ID: Map<string, CurriculumKey> = new Map();
for (const level of LEARNING_CURRICULUM_AZERTY) {
  for (const k of level.newKeys) GESTURE_BY_ID.set(k.id, k);
}
for (const k of Object.values(DEAD_KEYS)) GESTURE_BY_ID.set(k.id, k);

/** ^ et ¨ vivent sur la même touche physique AZERTY. */
const DEAD_KEY_POSITION = '^';

function highlightTargets(k: CurriculumKey): { id: string; finger: FingerId }[] {
  if (k.layer === 'deadkey') {
    return [
      { id: DEAD_KEY_POSITION, finger: DEAD_KEYS['^'].finger },
      { id: k.physical, finger: k.finger },
    ];
  }
  return [{ id: k.physical, finger: k.finger }];
}

export function KeyboardDiagramAzerty({
  highlightKeys,
  activeKeyId,
  expectedShiftHand,
  deadKeyStep,
}: KeyboardDiagramAzertyProps) {
  // id de touche physique -> couleur de doigt à appliquer
  const highlightMap = new Map<string, FingerId>();
  for (const k of highlightKeys ?? []) {
    for (const target of highlightTargets(k)) {
      highlightMap.set(target.id, target.finger);
    }
  }

  const activeGesture = activeKeyId ? GESTURE_BY_ID.get(activeKeyId) : undefined;
  let activePhysicalId: string | undefined;
  if (activeGesture) {
    activePhysicalId =
      activeGesture.layer === 'deadkey'
        ? (deadKeyStep ?? 1) === 2
          ? activeGesture.physical
          : DEAD_KEY_POSITION
        : activeGesture.physical;
  } else if (activeKeyId && ALL_KEYS.some((k) => k.id === activeKeyId)) {
    // repli : un id de touche physique brut (ex. 'f' à l'étape repères)
    activePhysicalId = activeKeyId;
  }

  const holdHand: 'L' | 'R' | undefined =
    activeGesture?.layer === 'shift' && expectedShiftHand
      ? expectedShiftHand
      : undefined;

  return (
    <div style={{ width: '100%' }} className="select-none">
      <svg
        viewBox="-2 0 420 166"
        aria-label="Schéma du clavier AZERTY"
        style={{
          width: '100%',
          minHeight: 'clamp(180px, 40vh, 320px)',
          maxWidth: 1000,
          objectFit: 'contain',
          display: 'block',
        }}
      >
        {ALL_KEYS.map((key) => {
          const isHighlight = highlightMap.has(key.id);
          const fingerColor =
            FINGER_COLORS[highlightMap.get(key.id) ?? key.finger];
          const isActive = activePhysicalId === key.id;
          const isHold =
            (key.id === 'ShiftLeft' && holdHand === 'L') ||
            (key.id === 'ShiftRight' && holdHand === 'R');
          const filled = isHighlight || isActive;
          const outlined = filled || isHold;

          return (
            <g
              key={key.id}
              data-key={key.id}
              data-finger={key.finger}
              {...(isHighlight ? { 'data-highlight': 'true' } : {})}
              {...(isActive ? { 'data-active': 'true' } : {})}
              {...(isHold ? { 'data-hold': 'true' } : {})}
            >
              <rect
                x={key.x}
                y={key.y}
                width={key.w}
                height={key.h}
                rx={4}
                fill={filled ? fingerColor : 'rgba(255,255,255,0.06)'}
                stroke={outlined ? fingerColor : 'rgba(255,255,255,0.14)'}
                strokeWidth={isActive || isHold ? 2.5 : outlined ? 1.5 : 1}
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 6px ${fingerColor})`
                    : undefined,
                  transition: 'fill 0.12s, stroke 0.12s',
                }}
              />
              {key.label && (
                <text
                  x={key.x + key.w / 2}
                  y={key.y + key.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={key.label.length > 1 ? 8 : 11}
                  fill={filled ? '#000' : 'rgba(255,255,255,0.72)'}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: filled ? 700 : 400,
                  }}
                >
                  {key.label.length > 1 ? key.label : key.label.toUpperCase()}
                </text>
              )}
              {key.sup && (
                <text
                  x={key.x + key.w - 6}
                  y={key.y + 9}
                  textAnchor="middle"
                  fontSize={7}
                  fill={filled ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)'}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {key.sup}
                </text>
              )}
              {isActive && activeGesture?.layer === 'deadkey' && (
                <text
                  x={key.x + 6}
                  y={key.y + 9}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#000"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                >
                  {(deadKeyStep ?? 1) === 2 ? '2' : '1'}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
