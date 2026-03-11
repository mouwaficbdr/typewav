'use client';

/**
 * RankBadge — badge de rang narratif.
 * Spec : docs/specs/05-progression.md
 */

import { RANKS, type RankTier } from '@typewav/types';

interface RankBadgeProps {
  rank: RankTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZE_MAP = {
  sm: { padding: '3px 10px', fontSize: 11, iconSize: 16 },
  md: { padding: '5px 14px', fontSize: 13, iconSize: 20 },
  lg: { padding: '8px 20px', fontSize: 16, iconSize: 28 },
};

const RANK_ICONS: Record<RankTier, string> = {
  novice: '◦',
  apprentice: '◈',
  operator: '◉',
  architect: '⬡',
  ghost: '◈',
};

export function RankBadge({
  rank,
  size = 'md',
  showLabel = true,
}: RankBadgeProps) {
  const rankData = RANKS[rank];
  const { padding, fontSize, iconSize } = SIZE_MAP[size];

  return (
    <span
      aria-label={`Rang : ${rankData.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${rankData.accentColor}33`,
        background: `${rankData.accentColor}11`,
        color: rankData.accentColor,
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
        fontSize,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ fontSize: iconSize, lineHeight: 1 }}>
        {RANK_ICONS[rank]}
      </span>
      {showLabel && rankData.label}
    </span>
  );
}
