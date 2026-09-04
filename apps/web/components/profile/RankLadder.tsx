'use client';

/**
 * RankLadder : les cinq paliers de rang, du plus haut au plus bas, avec la
 * position courante, une jauge de proximité vers le palier suivant et l'écart
 * de WPM à combler.
 *
 * C'est le levier de retour de la page profil : « suis-je proche du rang
 * d'après ». La jauge rend cette proximité palpable (game-feel diégétique, pas
 * un badge). Les libellés arrivent déjà localisés en props (le composant ne
 * connaît pas next-intl). Chaque palier porte sa couleur d'identité
 * (RANKS[tier].accentColor), déjà utilisée par RankBadge.
 */

import { RANKS, type RankTier } from '@typewav/types';

interface RankLadderProps {
  currentRank: RankTier;
  /** WPM médian de l'utilisateur, comparé au seuil du palier suivant. */
  currentWpm: number;
  labels: Record<RankTier, string>;
  /** Construit la phrase « {rank} à {minWpm} WPM · +{gap} à gagner ». */
  nextRankText: (nextLabel: string, minWpm: number, gap: number) => string;
  /** Affiché quand l'utilisateur est déjà au palier maximum. */
  maxedText: string;
  /** Anime la jauge de 0 à sa valeur à l'arrivée. */
  animate?: boolean;
}

const ASCENDING: RankTier[] = [
  'novice',
  'apprentice',
  'operator',
  'architect',
  'ghost',
];
// Affichage : on grimpe l'échelle, sommet en haut.
const DISPLAY_ORDER: RankTier[] = [...ASCENDING].reverse();

export function RankLadder({
  currentRank,
  currentWpm,
  labels,
  nextRankText,
  maxedText,
  animate = false,
}: RankLadderProps) {
  const currentIdx = ASCENDING.indexOf(currentRank);
  const nextTier = ASCENDING[currentIdx + 1];
  const roundedWpm = Math.round(currentWpm);
  const gap = nextTier
    ? Math.max(0, RANKS[nextTier].minWpm - roundedWpm)
    : 0;

  const floor = RANKS[currentRank].minWpm;
  const ceil = nextTier ? RANKS[nextTier].minWpm : floor;
  const progress =
    nextTier && ceil > floor
      ? Math.min(1, Math.max(0, (roundedWpm - floor) / (ceil - floor)))
      : 1;

  return (
    <div>
      <div role="list" style={{ display: 'flex', flexDirection: 'column' }}>
        {DISPLAY_ORDER.map((tier) => {
          const rank = RANKS[tier];
          const isCurrent = tier === currentRank;
          const isNext = tier === nextTier;
          const earned = ASCENDING.indexOf(tier) <= currentIdx;
          const edge = isCurrent
            ? rank.accentColor
            : isNext
              ? `color-mix(in srgb, ${rank.accentColor} 70%, transparent)`
              : earned
                ? `color-mix(in srgb, ${rank.accentColor} 45%, transparent)`
                : 'var(--color-border)';
          const labelColor = isCurrent
            ? 'var(--color-text-primary)'
            : isNext || earned
              ? 'var(--color-text-muted)'
              : 'color-mix(in srgb, var(--color-text-muted) 55%, transparent)';
          return (
            <div
              key={tier}
              role="listitem"
              {...(isCurrent ? { 'aria-current': 'true' as const } : {})}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 0 12px 14px',
                borderLeft: `2px solid ${edge}`,
                borderBottom:
                  '1px solid color-mix(in srgb, var(--color-border) 45%, transparent)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: isCurrent ? 600 : isNext ? 500 : 400,
                  color: labelColor,
                }}
              >
                {labels[tier]}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--color-text-muted)',
                }}
              >
                {rank.minWpm}+
              </span>
            </div>
          );
        })}
      </div>

      {nextTier ? (
        <div style={{ marginTop: 18 }}>
          <div
            role="progressbar"
            aria-valuemin={floor}
            aria-valuemax={ceil}
            aria-valuenow={roundedWpm}
            style={{
              height: 4,
              borderRadius: 999,
              background:
                'color-mix(in srgb, var(--color-border) 70%, transparent)',
              overflow: 'hidden',
            }}
          >
            <div
              data-testid="rank-gauge-fill"
              style={{
                height: '100%',
                width: `${Math.round(progress * 100)}%`,
                background: 'var(--color-accent)',
                borderRadius: 999,
                transformOrigin: 'left',
                transition: animate ? 'width 0.7s cubic-bezier(0.16,1,0.3,1)' : 'none',
              }}
            />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
              lineHeight: 1.5,
              color: 'var(--color-text-muted)',
              margin: '10px 0 0',
            }}
          >
            {nextRankText(labels[nextTier], RANKS[nextTier].minWpm, gap)}
          </p>
        </div>
      ) : (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            color: 'var(--color-accent)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '18px 0 0',
          }}
        >
          {maxedText}
        </p>
      )}
    </div>
  );
}
