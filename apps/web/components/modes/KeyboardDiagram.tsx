'use client';

/**
 * KeyboardDiagram : schéma QWERTY SVG interactif.
 * S'illumine sur la touche active et indique le doigt recommandé.
 * Spec : docs/specs/03-training-modes.md (Mode Apprentissage)
 */

import {
  mapKeyForLayout,
  resolvePhysicalKey,
  type KeyboardLayout,
} from '@/lib/keyboardLayouts';
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

// Disposition QWERTY : coordonnées normalisées
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

// Rangée du repos (positions physiques, invariantes par disposition).
const HOME_ROW_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

interface KeyboardDiagramProps {
  activeKey?: string;
  allowedKeys?: string[];
  /** Disposition physique du clavier de l'utilisateur (ticket #62). */
  layout?: KeyboardLayout;
  /**
   * Colore simultanément les 8 touches home row par doigt (au lieu d'une
   * seule touche "active" à la fois) et affiche un schéma de mains + une
   * légende des noms de doigts. Écran de positionnement des doigts du mode
   * Apprentissage (ticket #62) : contrairement à la frappe réelle, il n'y a
   * pas de touche active ici, donc rien ne s'allumait sans ce mode dédié.
   */
  showAllFingerColors?: boolean;
  /**
   * Positions physiques déjà "confirmées" par l'utilisateur (étape
   * interactive de l'écran de positionnement des doigts, ticket #62).
   */
  confirmedKeys?: string[];
}

export function KeyboardDiagram({
  activeKey,
  allowedKeys,
  layout = 'qwerty',
  showAllFingerColors = false,
  confirmedKeys,
}: KeyboardDiagramProps) {
  const t = useTranslations('typing');

  // `keyData.key` est toujours un identifiant de position physique en
  // label QWERTY (invariant par disposition) : resolvePhysicalKey retrouve
  // cette position à partir du caractère réellement tapé.
  const activePhysicalKey = activeKey
    ? resolvePhysicalKey(activeKey.toLowerCase(), layout)
    : undefined;
  const activeKeyData = activePhysicalKey
    ? KEYS.find((k) => k.key === activePhysicalKey)
    : undefined;

  const activeFinger = activeKeyData?.finger;
  const fingerLabel = activeFinger ? t(`finger.${activeFinger}`) : '';

  return (
    <div
      className="flex flex-col items-center gap-3 select-none"
      style={{ height: '100%', minHeight: 0 }}
    >
      <svg
        viewBox={showAllFingerColors ? '0 0 330 232' : '0 0 330 172'}
        aria-label={t('ariaKeyboardDiagram')}
        // Remplit l'espace que son conteneur lui donne réellement (flex:1
        // côté appelant) plutôt que de deviner une taille en vh : un
        // coefficient vh fixe ignore tout ce qui est empilé au-dessus (le
        // solde varie avec chaque écran), et ça a fini par couper le pied
        // de page sur un environnement différent de celui où il avait été
        // mesuré. objectFit:'contain' garde le ratio du viewBox, ne déborde
        // jamais ni en largeur ni en hauteur ; maxWidth reste une limite de
        // bon goût sur un très grand écran, pas un calcul de taille.
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          width: '100%',
          maxWidth: showAllFingerColors ? 620 : 900,
          objectFit: 'contain',
        }}
      >
        {/* Schéma de mains : un point coloré par doigt, relié à sa touche.
            Rendu en premier pour rester visuellement derrière le clavier
            (les lignes passent discrètement sous les rangées supérieures). */}
        {showAllFingerColors && (
          <g aria-hidden="true">
            <rect
              x={8}
              y={195}
              width={124}
              height={26}
              rx={13}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.1)"
            />
            <rect
              x={200}
              y={195}
              width={124}
              height={26}
              rx={13}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.1)"
            />
            {HOME_ROW_KEYS.map((key) => {
              const keyData = KEYS.find((k) => k.key === key)!;
              const cx = keyData.x + keyData.w / 2;
              const color = FINGER_COLORS[keyData.finger];
              return (
                <g key={`hand-${key}`}>
                  <line
                    x1={cx}
                    y1={208}
                    x2={cx}
                    y2={keyData.y + keyData.h}
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.55}
                  />
                  <circle cx={cx} cy={keyData.y + keyData.h} r={3} fill={color} />
                </g>
              );
            })}
            <line x1={120} y1={208} x2={140} y2={146} stroke={FINGER_COLORS.LT} strokeWidth={2} opacity={0.55} />
            <circle cx={140} cy={146} r={3} fill={FINGER_COLORS.LT} />
            <line x1={200} y1={208} x2={176} y2={146} stroke={FINGER_COLORS.RT} strokeWidth={2} opacity={0.55} />
            <circle cx={176} cy={146} r={3} fill={FINGER_COLORS.RT} />
          </g>
        )}

        {KEYS.map((keyData) => {
          const isActive = activePhysicalKey === keyData.key;
          const isAllowed = !allowedKeys || allowedKeys.includes(keyData.key);
          const isHomeRow = HOME_ROW_KEYS.includes(keyData.key);
          const isHighlighted =
            isActive || (showAllFingerColors && isHomeRow);
          const isConfirmed = confirmedKeys?.includes(keyData.key) ?? false;

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
                fill={
                  isHighlighted ? fingerColor : `rgba(255,255,255,${bgOpacity})`
                }
                stroke={
                  isHighlighted
                    ? fingerColor
                    : isAllowed
                      ? `rgba(255,255,255,0.15)`
                      : `rgba(255,255,255,0.05)`
                }
                strokeWidth={isActive ? 2 : isHighlighted ? 1.5 : 1}
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
                    isHighlighted
                      ? '#000'
                      : isAllowed
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(255,255,255,0.2)'
                  }
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isHighlighted ? 700 : 400,
                  }}
                >
                  {mapKeyForLayout(keyData.key, layout).toUpperCase()}
                </text>
              )}
              {isConfirmed && (
                <circle
                  data-confirmed="true"
                  cx={keyData.x + keyData.w - 3}
                  cy={keyData.y + 3}
                  r={4}
                  style={{ fill: 'var(--color-accent)' }}
                  stroke="#000"
                  strokeWidth={0.5}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Légende des doigts : ne pas reposer uniquement sur la couleur pour
          transmettre l'information (accessibilité), écran de
          positionnement des doigts (ticket #62). */}
      {showAllFingerColors && (
        <div
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          style={{ maxWidth: 460, flexShrink: 0 }}
        >
          {HOME_ROW_KEYS.map((key) => {
            const keyData = KEYS.find((k) => k.key === key)!;
            const color = FINGER_COLORS[keyData.finger];
            return (
              <span
                key={`legend-${key}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {mapKeyForLayout(key, layout).toUpperCase()} ·{' '}
                {t(`finger.${keyData.finger}`)}
              </span>
            );
          })}
        </div>
      )}

      {/* Indicateur de doigt */}
      {activeFinger && (
        <p
          style={{
            color: FINGER_COLORS[activeFinger],
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {fingerLabel}
        </p>
      )}
    </div>
  );
}
