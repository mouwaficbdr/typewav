'use client';

/**
 * MusicChip — chip ♪ affiché en fin de ligne 2 de la config bar.
 *
 * Affiche la pièce musicale active (recommandée ou sélectionnée manuellement).
 * Bouton ↺ pour une nouvelle suggestion dans le même registre.
 * Clic sur le nom ouvre le panel de sélection complète.
 *
 * Client Component justifié : état du panel, refresh.
 *
 * Spec : docs/specs/33-music-recommendation.md
 */

import { useMusicRecommendation } from '@/hooks/useMusicRecommendation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const REGISTER_LABELS: Record<string, string> = {
  energique: '⚡',
  contemplatif: '🌊',
  dramatique: '🎭',
  romantique: '🌹',
  folk: '🌍',
};

export function MusicChip() {
  const t = useTranslations('music');
  const { currentPiece, register, refresh } = useMusicRecommendation();
  const [panelOpen, setPanelOpen] = useState(false);

  if (!currentPiece) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        position: 'relative',
      }}
    >
      {/* Nom de la pièce — cliquable pour ouvrir le panel */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        aria-label={t('chipLabel', { piece: currentPiece.title })}
        aria-expanded={panelOpen}
      >
        <span aria-hidden="true">♪</span>
        <span>{currentPiece.shortTitle ?? currentPiece.title}</span>
        <span style={{ fontSize: '0.625rem', opacity: 0.7 }} aria-hidden="true">
          {REGISTER_LABELS[register]}
        </span>
      </button>

      {/* Bouton refresh — nouvelle suggestion, même registre */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          refresh();
        }}
        aria-label={t('refreshPiece')}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          padding: '2px 4px',
          opacity: 0.6,
        }}
        className="hover:opacity-100"
      >
        ↺
      </button>

      {/* Panel de sélection complète */}
      {panelOpen && (
        <div
          role="dialog"
          aria-label={t('selectPiece')}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 0',
            minWidth: 240,
            zIndex: 100,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              padding: '8px 16px',
            }}
          >
            {t('allPiecesComingSoon')}
          </p>
        </div>
      )}
    </div>
  );
}
