import { describe, expect, it } from 'vitest';
import { MUSIC_LIBRARY } from '../library';
import {
  MIDI_ASSET_INTEGRATIONS,
  MIDI_PARSER_VERSION,
  ROOT_MIDI_ASSET_INTEGRATIONS,
  UNMAPPED_MIDI_ASSET_FILES,
  UNMAPPED_ROOT_MIDI_FILES,
  getMidiAssetCacheVersion,
  getMidiAssetPath,
} from '../midi-assets';

describe('midi-assets integration', () => {
  it('référence les 25 fichiers .mid servis en public', () => {
    expect(MIDI_ASSET_INTEGRATIONS).toHaveLength(25);
  });

  it('retourne le chemin public pour une pièce mappée', () => {
    expect(getMidiAssetPath('fur-elise')).toBe('/midi/fur_Elise_WoO59.mid');
    expect(getMidiAssetPath('canon-in-d')).toBe('/midi/CanonInD.mid');
    expect(getMidiAssetPath('saitama-theme')).toBe('/midi/saitama_theme.mid');
  });

  it('retourne null pour une pièce sans asset dédié', () => {
    expect(getMidiAssetPath('korobeiniki')).toBeNull();
  });

  it('retourne une version de cache stable pour une pièce mappée', () => {
    expect(getMidiAssetCacheVersion('fur-elise')).toBe(
      `fur_Elise_WoO59.mid:${MIDI_PARSER_VERSION}`,
    );
  });

  it('inclut la version du pipeline de parsing dans la clé de cache — sans ça, un cache corrompu par un bug de parsing passé ne serait jamais invalidé tant que le nom de fichier ne change pas', () => {
    expect(getMidiAssetCacheVersion('fur-elise')).not.toBe(
      'fur_Elise_WoO59.mid',
    );
    expect(getMidiAssetCacheVersion('fur-elise')).toContain(
      MIDI_PARSER_VERSION,
    );
  });

  it('retourne null pour une pièce non mappée', () => {
    expect(getMidiAssetCacheVersion('korobeiniki')).toBeNull();
  });

  it('mappe toutes les pièces de la librairie active vers un asset public', () => {
    const missing = MUSIC_LIBRARY.map((piece) => piece.id).filter(
      (pieceId) => getMidiAssetPath(pieceId) === null,
    );

    expect(missing).toEqual([]);
  });

  it('expose les fichiers non mappés', () => {
    expect(UNMAPPED_MIDI_ASSET_FILES).toEqual(['horetzky21.mid']);
  });

  it('conserve des alias legacy pour compatibilité', () => {
    expect(ROOT_MIDI_ASSET_INTEGRATIONS).toBe(MIDI_ASSET_INTEGRATIONS);
    expect(UNMAPPED_ROOT_MIDI_FILES).toBe(UNMAPPED_MIDI_ASSET_FILES);
  });
});
