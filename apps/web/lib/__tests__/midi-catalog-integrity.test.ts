import { getPlayableMusicLibrary } from '@typewav/audio-engine';
import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Garde-fou : chaque morceau annoncé jouable dans le catalogue doit
 * réellement parser en au moins une note exploitable depuis son .mid réel.
 * Sans ce test, une régression comme celle observée sur Für Elise (fichier
 * valide, mais un maillon du pipeline produisant 0 note exploitable) peut
 * partir en production sans qu'aucun test ne le détecte.
 */
describe('intégrité du catalogue MIDI réel', () => {
  const playablePieces = getPlayableMusicLibrary();

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const filePath = `${process.cwd()}/apps/web/public${url}`;
        const bytes = await readFile(filePath);
        return {
          ok: true,
          arrayBuffer: async () =>
            bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
        } as Response;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('le catalogue jouable couvre au moins 24 morceaux', () => {
    expect(playablePieces.length).toBeGreaterThanOrEqual(24);
  });

  it.each(playablePieces.map((piece) => [piece.id, piece.midiPieceId] as const))(
    '%s (%s) parse en au moins une note exploitable depuis son .mid réel',
    async (_libraryId, midiPieceId) => {
      expect(midiPieceId).not.toBeNull();

      const { loadMidiPieceWithAssets } = await import('../midi-asset-loader');
      const parsedPiece = await loadMidiPieceWithAssets(midiPieceId!);

      expect(parsedPiece.notes.length).toBeGreaterThan(0);
      expect(
        parsedPiece.notes.every((note) => Number.isFinite(note.pitch)),
      ).toBe(true);
      expect(parsedPiece.bpmReference).toBeGreaterThan(0);
    },
  );
});
