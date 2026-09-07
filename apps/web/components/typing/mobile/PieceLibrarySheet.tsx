'use client';

/**
 * PieceLibrarySheet : le bac à disques, version mobile. Feuille qui monte du
 * bas, ouverte depuis PieceDeckBar. Même source de données que le menu desktop
 * d'ActiveSessionHeader (`useMusicRecommendation` + `filterMusicPieces`), mais
 * une présentation pensée pour le pouce : « Surprends-moi » en tête, recherche,
 * puces d'ambiance défilables, liste pleine largeur avec état jouable / bientôt.
 */

import { BottomSheet } from '@/components/ui/BottomSheet';
import { CheckIcon, SparklesIcon } from '@/components/ui/icons';
import { useMusicRecommendation } from '@/hooks/useMusicRecommendation';
import { filterMusicPieces } from '@/lib/music-filters';
import type { MidiPieceId } from '@typewav/audio-engine';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

interface PieceLibrarySheetProps {
  open: boolean;
  onClose: () => void;
  selectedPieceId: MidiPieceId;
  onPieceChange: (pieceId: MidiPieceId) => void;
}

const REGISTERS = [
  'energique',
  'contemplatif',
  'dramatique',
  'romantique',
  'folk',
] as const;

export function PieceLibrarySheet({
  open,
  onClose,
  selectedPieceId,
  onPieceChange,
}: PieceLibrarySheetProps) {
  const t = useTranslations('typing');
  const { register, refresh, allPieces, playablePieces } =
    useMusicRecommendation();
  const [query, setQuery] = useState('');
  const [registerFilter, setRegisterFilter] = useState('all');

  const registerLabel = (value: string) => {
    const labels: Record<string, string> = {
      energique: t('registerEnergique'),
      contemplatif: t('registerContemplatif'),
      dramatique: t('registerDramatique'),
      romantique: t('registerRomantique'),
      folk: t('registerFolk'),
    };
    return labels[value] ?? value;
  };

  const filtered = useMemo(
    () =>
      filterMusicPieces(allPieces, {
        query,
        register: registerFilter,
        composer: 'all',
      }),
    [allPieces, query, registerFilter],
  );

  const pick = (pieceId: MidiPieceId | null) => {
    if (!pieceId) return;
    onPieceChange(pieceId);
    onClose();
  };

  const surpriseMe = () => {
    // Même logique que le rafraîchissement de recommandation desktop : lire le
    // retour direct de refresh() (setCurrentPiece est async), avec repli sur
    // une pièce jouable du registre recommandé.
    const next = refresh();
    const midiId =
      next?.midiPieceId ??
      playablePieces.find((piece) => piece.register === register)?.midiPieceId ??
      playablePieces[0]?.midiPieceId ??
      null;
    pick(midiId ?? null);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t('libraryTitle')}>
      <button
        type="button"
        onClick={surpriseMe}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          minHeight: 44,
          padding: '10px 16px',
          marginBottom: 12,
          border: '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <SparklesIcon size={16} />
        {t('surpriseMe')}
      </button>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('musicSearchPlaceholder')}
        aria-label={t('musicSearchPlaceholder')}
        spellCheck={false}
        autoComplete="off"
        className="form-input"
        style={{
          width: '100%',
          minHeight: 44,
          padding: '10px 14px',
          marginBottom: 12,
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
        }}
      />

      {/* Puces d'ambiance, défilables horizontalement */}
      <div
        role="group"
        aria-label={t('musicRegisterFilter')}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          overscrollBehavior: 'contain',
          padding: '2px 0 12px',
          marginInline: -2,
          paddingInline: 2,
        }}
      >
        {(['all', ...REGISTERS] as const).map((value) => {
          const active = registerFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRegisterFilter(value)}
              aria-pressed={active}
              style={{
                flexShrink: 0,
                minHeight: 36,
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid var(--color-border)',
                background: active
                  ? 'var(--color-text-primary)'
                  : 'transparent',
                color: active ? 'var(--color-bg)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {value === 'all' ? t('musicFilterAllRegisters') : registerLabel(value)}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((piece) => {
          const isSelected = selectedPieceId === piece.midiPieceId;
          const playable = piece.midiPieceId !== null;
          return (
            <button
              key={piece.id}
              type="button"
              onClick={() => pick(piece.midiPieceId)}
              disabled={!playable}
              aria-current={isSelected ? 'true' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                minHeight: 56,
                padding: '10px 12px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: isSelected
                  ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)'
                  : 'transparent',
                color: playable
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                textAlign: 'left',
                cursor: playable ? 'pointer' : 'default',
                opacity: playable ? 1 : 0.65,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: playable
                    ? 'var(--color-accent)'
                    : 'color-mix(in srgb, var(--color-text-muted) 60%, transparent)',
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {piece.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.74rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {piece.composer}
                  </span>
                  <span style={{ opacity: 0.6 }}>·</span>
                  <span style={{ flexShrink: 0 }}>
                    {registerLabel(piece.register)}
                  </span>
                  {!playable && (
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '1px 7px',
                        borderRadius: 999,
                        border: '1px solid var(--color-border)',
                        fontSize: '0.66rem',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {t('comingSoonBadge')}
                    </span>
                  )}
                </div>
              </div>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 16,
                  display: 'flex',
                  color: 'var(--color-accent)',
                }}
              >
                {isSelected && <CheckIcon size={16} />}
              </span>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p
            style={{
              margin: '12px 0',
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
            }}
          >
            {t('musicNoResults')}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
