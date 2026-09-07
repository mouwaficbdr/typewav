'use client';

/**
 * PieceDeckBar : « la platine ». Sur l'écran de frappe mobile, remplace tout le
 * cluster desktop (ActiveSessionHeader + ContextSelectors + CollectionSelector).
 *
 * Une barre pleine largeur, une ligne principale tapable (ouvre la bibliothèque
 * de morceaux, PieceLibrarySheet) et une puce secondaire « collection · langue »
 * tapable (ouvre TextContextSheet). La musique d'un côté, le texte de l'autre.
 */

import { MusicBarsIcon } from '@/components/ui/icons';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useMusicRecommendation } from '@/hooks/useMusicRecommendation';
import { MODES_WITH_TEXT_CONFIG } from '@/lib/typing-mode-support';
import { useConfigStore } from '@/stores/useConfigStore';
import type { MidiPieceId } from '@typewav/audio-engine';
import type { TypingMode } from '@typewav/types';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PieceLibrarySheet } from './PieceLibrarySheet';
import { TextContextSheet } from './TextContextSheet';

interface PieceDeckBarProps {
  selectedPieceId: MidiPieceId;
  onPieceChange: (pieceId: MidiPieceId) => void;
  effectiveMode: TypingMode;
}

export function PieceDeckBar({
  selectedPieceId,
  onPieceChange,
  effectiveMode,
}: PieceDeckBarProps) {
  const t = useTranslations('typing');
  const tCollections = useTranslations('typing.collection' as never) as (
    k: string,
  ) => string;
  const { allPieces } = useMusicRecommendation();
  const activeCollection = useConfigStore((s) => s.activeCollection);
  const textLanguage = useConfigStore((s) => s.textLanguage);

  const [librarySheetOpen, setLibrarySheetOpen] = useState(false);
  const [textSheetOpen, setTextSheetOpen] = useState(false);

  const selectedPiece = useMemo(
    () => allPieces.find((piece) => piece.midiPieceId === selectedPieceId),
    [allPieces, selectedPieceId],
  );

  const pieceLabel =
    selectedPiece?.shortTitle ?? selectedPiece?.title ?? t('noPiece');
  const playable = selectedPiece ? selectedPiece.midiPieceId !== null : false;

  const showTextChip =
    MODES_WITH_TEXT_CONFIG.includes(effectiveMode) || effectiveMode === 'code';
  const langShort =
    textLanguage === 'both'
      ? t('langBoth')
      : textLanguage === 'fr'
        ? t('langFr')
        : t('langEn');
  const textChipLabel = MODES_WITH_TEXT_CONFIG.includes(effectiveMode)
    ? `${tCollections(activeCollection)} · ${langShort}`
    : langShort;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 420,
        marginInline: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <button
        type="button"
        onClick={() => setLibrarySheetOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={librarySheetOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          minHeight: 52,
          padding: '10px 14px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--color-surface) 70%, transparent)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          textAlign: 'left',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            display: 'flex',
            color: 'var(--color-accent)',
          }}
        >
          <MusicBarsIcon size={18} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.95rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {pieceLabel}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-ui)',
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: playable
                  ? 'var(--color-accent)'
                  : 'color-mix(in srgb, var(--color-text-muted) 60%, transparent)',
              }}
            />
            {playable ? t('playableBadge') : t('comingSoonBadge')}
          </span>
        </span>
        <span
          aria-hidden="true"
          style={{ flexShrink: 0, display: 'flex', color: 'var(--color-text-muted)' }}
        >
          <ChevronRightIcon size={18} />
        </span>
      </button>

      {showTextChip && (
        <button
          type="button"
          onClick={() => setTextSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={textSheetOpen}
          style={{
            alignSelf: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            padding: '4px 12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
          className="hover:text-[var(--color-text-primary)]"
        >
          {textChipLabel}
          <ChevronRightIcon size={13} />
        </button>
      )}

      <PieceLibrarySheet
        open={librarySheetOpen}
        onClose={() => setLibrarySheetOpen(false)}
        selectedPieceId={selectedPieceId}
        onPieceChange={onPieceChange}
      />
      <TextContextSheet
        open={textSheetOpen}
        onClose={() => setTextSheetOpen(false)}
        effectiveMode={effectiveMode}
      />
    </div>
  );
}
