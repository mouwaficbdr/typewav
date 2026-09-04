'use client';

/**
 * RankLadder : les cinq paliers de rang, du plus haut au plus bas, avec la
 * position courante et l'écart de WPM à combler pour le suivant.
 *
 * C'est le levier de retour de la page profil : « suis-je proche du rang
 * d'après ». Les libellés arrivent déjà localisés en props (le composant ne
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
}: RankLadderProps) {
  const currentIdx = ASCENDING.indexOf(currentRank);
  const nextTier = ASCENDING[currentIdx + 1];
  const gap = nextTier
    ? Math.max(0, RANKS[nextTier].minWpm - Math.round(currentWpm))
    : 0;

  return (
    <div role="list" style={{ display: 'flex', flexDirection: 'column' }}>
      {DISPLAY_ORDER.map((tier) => {
        const rank = RANKS[tier];
        const isCurrent = tier === currentRank;
        const earned = ASCENDING.indexOf(tier) <= currentIdx;
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
              borderLeft: `2px solid ${
                isCurrent
                  ? rank.accentColor
                  : earned
                    ? `color-mix(in srgb, ${rank.accentColor} 45%, transparent)`
                    : 'var(--color-border)'
              }`,
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
                fontWeight: isCurrent ? 600 : 400,
                color: isCurrent
                  ? 'var(--color-text-primary)'
                  : earned
                    ? 'var(--color-text-muted)'
                    : 'color-mix(in srgb, var(--color-text-muted) 55%, transparent)',
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

      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          lineHeight: 1.5,
          color: 'var(--color-text-muted)',
          margin: '16px 0 0',
        }}
      >
        {nextTier
          ? nextRankText(labels[nextTier], RANKS[nextTier].minWpm, gap)
          : maxedText}
      </p>
    </div>
  );
}
