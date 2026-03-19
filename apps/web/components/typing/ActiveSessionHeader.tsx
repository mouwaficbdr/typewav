'use client';

import { MusicNoteIcon, RefreshIcon } from '@/components/ui/icons';
import { useMusicRecommendation } from '@/hooks/useMusicRecommendation';
import type { MidiPieceId } from '@typewav/audio-engine';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ActiveSessionHeaderProps {
  selectedPieceId: MidiPieceId;
  onPieceChange: (pieceId: MidiPieceId) => void;
}

export function ActiveSessionHeader({
  selectedPieceId,
  onPieceChange,
}: ActiveSessionHeaderProps) {
  const t = useTranslations('typing');
  const {
    currentPiece,
    register,
    refresh,
    allPieces,
    playablePieces,
    recommendedPlayablePieceId,
  } = useMusicRecommendation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedPiece = useMemo(
    () => allPieces.find((piece) => piece.midiPieceId === selectedPieceId),
    [allPieces, selectedPieceId],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleShuffle = () => {
    const candidates = playablePieces.filter(
      (piece) => piece.midiPieceId !== selectedPieceId,
    );
    if (candidates.length === 0) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    if (!next?.midiPieceId) return;
    onPieceChange(next.midiPieceId);
  };

  const handleRefreshRecommendation = () => {
    refresh();

    if (recommendedPlayablePieceId) {
      onPieceChange(recommendedPlayablePieceId);
      return;
    }

    const fallback = playablePieces.find(
      (piece) => piece.register === register,
    );
    if (fallback?.midiPieceId) {
      onPieceChange(fallback.midiPieceId);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 16,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.85rem',
        userSelect: 'none',
      }}
    >
      {/* Meta de la piece active (source unique = selectedPieceId) */}
      {selectedPiece && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MusicNoteIcon size={12} className="opacity-70" />
          <span
            style={{
              maxWidth: '400px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedPiece.composer} - {selectedPiece.title}
          </span>
        </div>
      )}

      <button
        onClick={handleRefreshRecommendation}
        title={t('recommendationCta')}
        style={{
          background:
            'color-mix(in srgb, var(--color-accent) 10%, transparent)',
          border:
            '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.72rem',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        }}
        className="hover:scale-[1.03]"
      >
        <MusicNoteIcon size={11} />
        <span>{t('registerRecommendation', { register })}</span>
      </button>

      {/* Selecteur de Musique */}
      <div
        ref={menuRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          position: 'relative',
        }}
      >
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
            backgroundColor: isMenuOpen
              ? 'var(--color-surface)'
              : 'color-mix(in srgb, var(--color-bg) 50%, transparent)',
          }}
          className="hover:text-text-primary"
        >
          <MusicNoteIcon size={12} />
          <span>
            {selectedPiece?.shortTitle ?? selectedPiece?.title ?? t('noPiece')}
          </span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShuffle();
          }}
          title={t('shuffleTrack')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            padding: '4px',
            opacity: 0.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="hover:opacity-100 hover:rotate-180 transition-all duration-300"
        >
          <RefreshIcon size={12} />
        </button>

        {/* Dropdown Library */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              role="dialog"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px',
                minWidth: 280,
                zIndex: 50,
                maxHeight: 280,
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
              className="hide-scrollbar"
            >
              <div
                style={{
                  padding: '0 8px 8px',
                  borderBottom: '1px solid var(--color-border)',
                  marginBottom: 4,
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {t('library')}: {allPieces.length} ·{' '}
                {t('playableNowCount', { count: playablePieces.length })}
              </div>

              {allPieces.map((piece) => (
                <button
                  key={piece.id}
                  onClick={() => {
                    if (!piece.midiPieceId) return;
                    onPieceChange(piece.midiPieceId);
                    setIsMenuOpen(false);
                  }}
                  disabled={!piece.midiPieceId}
                  style={{
                    background:
                      selectedPieceId === piece.midiPieceId
                        ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
                        : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color:
                      selectedPieceId === piece.midiPieceId
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    opacity: piece.midiPieceId ? 1 : 0.62,
                  }}
                  className="hover:text-text-primary"
                >
                  <MusicNoteIcon size={14} className="opacity-50" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {piece.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span>{piece.composer}</span>
                      <span
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: '999px',
                          padding: '1px 6px',
                          fontSize: '0.62rem',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {piece.midiPieceId
                          ? t('playableBadge')
                          : t('comingSoonBadge')}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
