'use client';

import { MusicNoteIcon, RefreshIcon } from '@/components/ui/icons';
import { useMusicRecommendation } from '@/hooks/useMusicRecommendation';
import { filterMusicPieces } from '@/lib/music-filters';
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
  const { currentPiece, register, refresh, allPieces, playablePieces } =
    useMusicRecommendation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [registerFilter, setRegisterFilter] = useState('all');
  const [composerFilter, setComposerFilter] = useState('all');
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const closeMenu = (returnFocus: boolean) => {
    setIsMenuOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const registerOptions = useMemo(
    () => Array.from(new Set(allPieces.map((piece) => piece.register))).sort(),
    [allPieces],
  );

  const composerOptions = useMemo(
    () => Array.from(new Set(allPieces.map((piece) => piece.composer))).sort(),
    [allPieces],
  );

  const filteredPieces = useMemo(
    () =>
      filterMusicPieces(allPieces, {
        query,
        register: registerFilter,
        composer: composerFilter,
      }),
    [allPieces, query, registerFilter, composerFilter],
  );

  const filteredPlayableCount = useMemo(
    () => filteredPieces.filter((piece) => piece.midiPieceId !== null).length,
    [filteredPieces],
  );

  const formatRegisterLabel = (value: string) => {
    const labels: Record<string, string> = {
      energique: t('registerEnergique'),
      contemplatif: t('registerContemplatif'),
      dramatique: t('registerDramatique'),
      romantique: t('registerRomantique'),
      folk: t('registerFolk'),
    };

    return labels[value] ?? value;
  };

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

  // À l'ouverture, le focus clavier entre dans le menu (champ de recherche).
  useEffect(() => {
    if (isMenuOpen) searchInputRef.current?.focus();
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
    // Lit le retour direct de refresh() plutôt que
    // recommendedPlayablePieceId : ce dernier ne reflète le nouveau tirage
    // qu'au rendu suivant (setCurrentPiece est async), donc le lire ici
    // renvoyait encore l'ancienne pièce : le chip semblait ne rien faire
    // (audit configbar, décision 5 / B4).
    const next = refresh();
    const midiId =
      next?.midiPieceId ??
      playablePieces.find((piece) => piece.register === register)
        ?.midiPieceId;
    if (midiId) {
      onPieceChange(midiId);
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
          ref={triggerRef}
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={isMenuOpen}
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
              aria-label={t('library')}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  closeMenu(true);
                }
              }}
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

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 6,
                  padding: '0 6px 8px',
                  borderBottom: '1px solid var(--color-border)',
                  marginBottom: 4,
                }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('musicSearchPlaceholder')}
                  aria-label={t('musicSearchPlaceholder')}
                  style={{
                    width: '100%',
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background:
                      'color-mix(in srgb, var(--color-bg) 45%, transparent)',
                    color: 'var(--color-text-primary)',
                    padding: '0 8px',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.74rem',
                  }}
                />

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                  }}
                >
                  <select
                    value={registerFilter}
                    onChange={(e) => setRegisterFilter(e.target.value)}
                    aria-label={t('musicRegisterFilter')}
                    style={{
                      width: '100%',
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background:
                        'color-mix(in srgb, var(--color-bg) 45%, transparent)',
                      color: 'var(--color-text-primary)',
                      padding: '0 8px',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.72rem',
                    }}
                  >
                    <option value="all">{t('musicFilterAllRegisters')}</option>
                    {registerOptions.map((value) => (
                      <option key={value} value={value}>
                        {formatRegisterLabel(value)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={composerFilter}
                    onChange={(e) => setComposerFilter(e.target.value)}
                    aria-label={t('musicComposerFilter')}
                    style={{
                      width: '100%',
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background:
                        'color-mix(in srgb, var(--color-bg) 45%, transparent)',
                      color: 'var(--color-text-primary)',
                      padding: '0 8px',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.72rem',
                    }}
                  >
                    <option value="all">{t('musicFilterAllComposers')}</option>
                    {composerOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--color-text-muted)',
                    paddingLeft: 2,
                  }}
                >
                  {filteredPieces.length} {t('musicResults')} ·{' '}
                  {t('playableNowCount', { count: filteredPlayableCount })}
                </div>
              </div>

              {filteredPieces.map((piece) => (
                <button
                  key={piece.id}
                  onClick={() => {
                    if (!piece.midiPieceId) return;
                    onPieceChange(piece.midiPieceId);
                    closeMenu(true);
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
                    opacity: 1,
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
                        {formatRegisterLabel(piece.register)}
                      </span>
                    </span>
                  </div>
                </button>
              ))}

              {filteredPieces.length === 0 && (
                <div
                  style={{
                    padding: '10px 8px',
                    fontSize: '0.74rem',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                  }}
                >
                  {t('musicNoResults')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
