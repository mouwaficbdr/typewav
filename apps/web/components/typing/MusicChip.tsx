'use client';

/**
 * MusicChip — chip de sélection du pack sonore actif.
 *
 * Stub — implémentation complète : spec-33.
 * Affiche le pack actif et permet de l'ouvrir via un dropdown.
 */

import { useAudioStore } from '@/stores/useAudioStore';

export function MusicChip() {
  const { soundPackId } = useAudioStore();

  return (
    <button
      aria-label="Pack sonore"
      title="Pack sonore"
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        padding: '3px 8px',
        transition: 'color 0.1s',
      }}
    >
      ♪ {soundPackId}
    </button>
  );
}
