import type { ParsedPiece } from '@typewav/audio-engine';
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearInMemoryMidiPieceCache,
  getCachedMidiPiece,
  invalidateCachedMidiPiece,
  setCachedMidiPiece,
} from '../midi-piece-cache';

const BASE_PIECE: ParsedPiece = {
  id: 'fur-elise',
  title: 'Für Elise',
  composer: 'Beethoven',
  year: 1900,
  notes: [
    {
      pitch: 76,
      durationSec: 0.125,
      durationTicks: 120,
      startTick: 0,
      velocity: 100,
      isPhraseBoundary: false,
    },
  ],
  bpmReference: 120,
  ppq: 480,
  totalDurationSec: 0.125,
};

describe('midi-piece-cache', () => {
  beforeEach(() => {
    clearInMemoryMidiPieceCache();
  });

  it('retourne une piece mise en cache pour la meme version', async () => {
    await setCachedMidiPiece('fur-elise', 'asset-v1', BASE_PIECE);

    const cached = await getCachedMidiPiece('fur-elise', 'asset-v1');

    expect(cached).toEqual(BASE_PIECE);
  });

  it('invalide une entree quand la version change', async () => {
    await setCachedMidiPiece('fur-elise', 'asset-v1', BASE_PIECE);

    const stale = await getCachedMidiPiece('fur-elise', 'asset-v2');

    expect(stale).toBeNull();
  });

  it('invalidateCachedMidiPiece supprime une entrée corrompue du cache mémoire — le prochain appel ne doit plus jamais la revoir', async () => {
    await setCachedMidiPiece('fur-elise', 'asset-v1', BASE_PIECE);

    await invalidateCachedMidiPiece('fur-elise');

    expect(await getCachedMidiPiece('fur-elise', 'asset-v1')).toBeNull();
  });
});
