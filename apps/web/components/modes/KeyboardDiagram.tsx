'use client';

/**
 * KeyboardDiagram — schéma QWERTY SVG interactif.
 * S'illumine sur la touche active et indique le doigt recommandé.
 * Spec : docs/specs/03-training-modes.md — Mode Apprentissage
 */

import { useTranslations } from 'next-intl';

interface KeyData {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  finger: 'LP' | 'LR' | 'LM' | 'LI' | 'LT' | 'RI' | 'RM' | 'RR' | 'RP' | 'RT';
}

const FINGER_COLORS: Record<KeyData['finger'], string> = {
  LP: '#FF6B6B', // Auriculaire gauche
  LR: '#FF9F43', // Annulaire gauche
  LM: '#FECA57', // Majeur gauche
  LI: '#48DBFB', // Index gauche
  LT: '#A29BFE', // Pouce gauche
  RT: '#A29BFE', // Pouce droit
  RI: '#00D4AA', // Index droit
  RM: '#1DD1A1', // Majeur droit
  RR: '#54A0FF', // Annulaire droit
  RP: '#C44569', // Auriculaire droit
};

// Les labels sont maintenant gérés via next-intl dans le composant

// Disposition QWERTY — coordonnées normalisées
const KEYS: KeyData[] = [
  // Row 1 : chiffres (omis dans l'apprentissage de base)
  // Row 2 : QWERTYUIOP
  { key: 'q', x: 0, y: 36, w: 28, h: 28, finger: 'LP' },
  { key: 'w', x: 32, y: 36, w: 28, h: 28, finger: 'LR' },
  { key: 'e', x: 64, y: 36, w: 28, h: 28, finger: 'LM' },
  { key: 'r', x: 96, y: 36, w: 28, h: 28, finger: 'LI' },
  { key: 't', x: 128, y: 36, w: 28, h: 28, finger: 'LI' },
  { key: 'y', x: 160, y: 36, w: 28, h: 28, finger: 'RI' },
  { key: 'u', x: 192, y: 36, w: 28, h: 28, finger: 'RI' },
  { key: 'i', x: 224, y: 36, w: 28, h: 28, finger: 'RM' },
  { key: 'o', x: 256, y: 36, w: 28, h: 28, finger: 'RR' },
  { key: 'p', x: 288, y: 36, w: 28, h: 28, finger: 'RP' },
  // Row 3 : ASDFGHJKL;  (Home Row)
  { key: 'a', x: 8, y: 68, w: 28, h: 28, finger: 'LP' },
  { key: 's', x: 40, y: 68, w: 28, h: 28, finger: 'LR' },
  { key: 'd', x: 72, y: 68, w: 28, h: 28, finger: 'LM' },
  { key: 'f', x: 104, y: 68, w: 28, h: 28, finger: 'LI' },
  { key: 'g', x: 136, y: 68, w: 28, h: 28, finger: 'LI' },
  { key: 'h', x: 168, y: 68, w: 28, h: 28, finger: 'RI' },
  { key: 'j', x: 200, y: 68, w: 28, h: 28, finger: 'RI' },
  { key: 'k', x: 232, y: 68, w: 28, h: 28, finger: 'RM' },
  { key: 'l', x: 264, y: 68, w: 28, h: 28, finger: 'RR' },
  { key: ';', x: 296, y: 68, w: 28, h: 28, finger: 'RP' },
  // Row 4 : ZXCVBNM
  { key: 'z', x: 20, y: 100, w: 28, h: 28, finger: 'LP' },
  { key: 'x', x: 52, y: 100, w: 28, h: 28, finger: 'LR' },
  { key: 'c', x: 84, y: 100, w: 28, h: 28, finger: 'LM' },
  { key: 'v', x: 116, y: 100, w: 28, h: 28, finger: 'LI' },
  { key: 'b', x: 148, y: 100, w: 28, h: 28, finger: 'LI' },
  { key: 'n', x: 180, y: 100, w: 28, h: 28, finger: 'RI' },
  { key: 'm', x: 212, y: 100, w: 28, h: 28, finger: 'RM' },
  // Espace
  { key: ' ', x: 88, y: 132, w: 140, h: 28, finger: 'RT' },
];

interface KeyboardDiagramProps {
  activeKey?: string;
  allowedKeys?: string[];
}

export function KeyboardDiagram({
  activeKey,
  allowedKeys,
}: KeyboardDiagramProps) {
  const t = useTranslations('typing');

  const activeKeyData = activeKey
    ? KEYS.find((k) => k.key === activeKey.toLowerCase())
    : undefined;

  const activeFinger = activeKeyData?.finger;
  const fingerLabel = activeFinger ? t(`finger.${activeFinger}`) : '';

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <svg
        viewBox="0 0 330 172"
        aria-label={t('ariaKeyboardDiagram')}
        style={{ width: '100%', maxWidth: 500 }}
      >
        {KEYS.map((keyData) => {
          const isActive = activeKey?.toLowerCase() === keyData.key;
          const isAllowed = !allowedKeys || allowedKeys.includes(keyData.key);
          const isHomeRow = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'].includes(
            keyData.key,
          );

          const fingerColor = FINGER_COLORS[keyData.finger];
          const bgOpacity = isAllowed ? (isHomeRow ? 0.15 : 0.08) : 0.03;

          return (
            <g key={keyData.key}>
              <rect
                x={keyData.x}
                y={keyData.y}
                width={keyData.w}
                height={keyData.h}
                rx={4}
                fill={isActive ? fingerColor : `rgba(255,255,255,${bgOpacity})`}
                stroke={
                  isActive
                    ? fingerColor
                    : isAllowed
                      ? `rgba(255,255,255,0.15)`
                      : `rgba(255,255,255,0.05)`
                }
                strokeWidth={isActive ? 2 : 1}
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 6px ${fingerColor})`
                    : undefined,
                  transition: 'fill 0.1s, stroke 0.1s',
                }}
              />
              {keyData.key !== ' ' && (
                <text
                  x={keyData.x + keyData.w / 2}
                  y={keyData.y + keyData.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill={
                    isActive
                      ? '#000'
                      : isAllowed
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(255,255,255,0.2)'
                  }
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {keyData.key.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Indicateur de doigt */}
      {activeFinger && (
        <p
          style={{
            color: FINGER_COLORS[activeFinger],
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {fingerLabel}
        </p>
      )}
    </div>
  );
}
