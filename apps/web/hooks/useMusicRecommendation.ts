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
import {
  getMidiPieceIdFromLibraryId,
  getPlayableMusicLibrary,
  getRecommendedPiece,
  getRecommendedRegister,
  getUnifiedMusicLibrary,
  getUnifiedPieceByMidiId,
  pickPiece,
  type EmotionalRegister,
  type UnifiedMusicPiece,
} from '@typewav/audio-engine';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useMusicRecommendation() {
  const mode = useSessionStore((s) => s.mode);
  const collectionId = useSessionStore((s) => s.collectionId);
  const activePieceId = useAudioStore((s) => s.activePieceId);
  const durationSeconds = 60;

  const [currentPiece, setCurrentPiece] = useState<UnifiedMusicPiece | null>(
    null,
  );
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const allPieces = useMemo(() => getUnifiedMusicLibrary(), []);
  const playablePieces = useMemo(() => getPlayableMusicLibrary(), []);
  const register = useMemo<EmotionalRegister>(
    () => getRecommendedRegister(mode, collectionId as never, durationSeconds),
    [mode, collectionId, durationSeconds],
  );

  // Recalculer la recommandation quand le contexte change
  useEffect(() => {
    let cancelled = false;
    const schedulePieceUpdate = (piece: UnifiedMusicPiece | null) => {
      queueMicrotask(() => {
        if (!cancelled) {
          setCurrentPiece(piece);
        }
      });
    };

    if (activePieceId) {
      const active = getUnifiedPieceByMidiId(activePieceId);
      schedulePieceUpdate(active ?? null);
    } else {
      const piece = getRecommendedPiece(
        mode,
        collectionId as never,
        durationSeconds,
        recentIds,
      );
      if (!piece) {
        schedulePieceUpdate(null);
      } else {
        schedulePieceUpdate({
          ...piece,
          midiPieceId: getMidiPieceIdFromLibraryId(piece.id),
          isPlayableNow: getMidiPieceIdFromLibraryId(piece.id) !== null,
        });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [mode, collectionId, activePieceId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Demande une nouvelle suggestion dans le même registre */
  const refresh = useCallback(() => {
    const next = pickPiece(register, recentIds);
    if (next) {
      setRecentIds((prev) => [...prev.slice(-4), next.id]);
      const midiPieceId = getMidiPieceIdFromLibraryId(next.id);
      setCurrentPiece({
        ...next,
        midiPieceId,
        isPlayableNow: midiPieceId !== null,
      });
    }
  }, [register, recentIds]);

  /** Override manuel — sélection explicite par l'utilisateur */
  const selectPiece = useCallback((piece: UnifiedMusicPiece) => {
    setRecentIds((prev) => [...prev.slice(-4), piece.id]);
    setCurrentPiece(piece);
  }, []);

  const recommendedPlayablePieceId = useMemo(() => {
    if (!currentPiece) return null;

    if (currentPiece.midiPieceId) return currentPiece.midiPieceId;

    const fallback = playablePieces.find(
      (piece) => piece.register === currentPiece.register,
    );
    return fallback?.midiPieceId ?? null;
  }, [currentPiece, playablePieces]);

  return {
    currentPiece,
    register,
    refresh,
    selectPiece,
    allPieces,
    playablePieces,
    recommendedPlayablePieceId,
  };
}
