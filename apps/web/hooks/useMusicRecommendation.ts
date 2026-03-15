'use client';

/**
 * useMusicRecommendation — recommandation musicale contextuelle.
 *
 * Lit le mode et la collection depuis useSessionStore,
 * calcule le registre recommandé, retourne la pièce courante et les actions.
 *
 * Client Component justifié : lit des stores Zustand.
 *
 * Spec : docs/specs/33-music-recommendation.md
 */

import { useAudioStore } from '@/stores/useAudioStore';
import { useSessionStore } from '@/stores/useSessionStore';
import type { MusicPiece } from '@typewav/audio-engine';
import {
  MUSIC_LIBRARY,
  getRecommendedPiece,
  getRecommendedRegister,
  pickPiece,
  type EmotionalRegister,
} from '@typewav/audio-engine';
import { useCallback, useEffect, useState } from 'react';

export function useMusicRecommendation() {
  const mode = useSessionStore((s) => s.mode);
  const collectionId = useSessionStore((s) => s.collectionId);
  const activePieceId = useAudioStore((s) => s.activePieceId);

  const [currentPiece, setCurrentPiece] = useState<MusicPiece | null>(null);
  const [register, setRegister] = useState<EmotionalRegister>('romantique');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Recalculer la recommandation quand le contexte change
  useEffect(() => {
    const durationSeconds = 60;
    const rec = getRecommendedRegister(
      mode,
      collectionId as never,
      durationSeconds,
    );
    setRegister(rec);

    if (!activePieceId) {
      const piece = getRecommendedPiece(
        mode,
        collectionId as never,
        durationSeconds,
        recentIds,
      );
      setCurrentPiece(piece);
    }
  }, [mode, collectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Demande une nouvelle suggestion dans le même registre */
  const refresh = useCallback(() => {
    const next = pickPiece(register, recentIds);
    if (next) {
      setRecentIds((prev) => [...prev.slice(-4), next.id]);
      setCurrentPiece(next);
    }
  }, [register, recentIds]);

  /** Override manuel — sélection explicite par l'utilisateur */
  const selectPiece = useCallback((piece: MusicPiece) => {
    setRecentIds((prev) => [...prev.slice(-4), piece.id]);
    setCurrentPiece(piece);
  }, []);

  return {
    currentPiece,
    register,
    refresh,
    selectPiece,
    allPieces: MUSIC_LIBRARY,
  };
}
