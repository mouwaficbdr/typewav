import { describe, expect, it } from 'vitest';
import {
  MIDI_ASSET_INTEGRATIONS,
  ROOT_MIDI_ASSET_INTEGRATIONS,
  UNMAPPED_MIDI_ASSET_FILES,
  UNMAPPED_ROOT_MIDI_FILES,
  getMidiAssetPath,
} from '../midi-assets';

describe('midi-assets integration', () => {
  it('référence les 10 fichiers .mid servis en public', () => {
    expect(MIDI_ASSET_INTEGRATIONS).toHaveLength(10);
  });

  it('retourne le chemin public pour une pièce mappée', () => {
    expect(getMidiAssetPath('fur-elise')).toBe('/midi/fur_Elise_WoO59.mid');
    expect(getMidiAssetPath('canon-in-d')).toBe('/midi/CanonInD.mid');
  });

  it('retourne null pour une pièce sans asset dédié', () => {
    expect(getMidiAssetPath('korobeiniki')).toBeNull();
  });

  it('expose les fichiers non mappés', () => {
    expect(UNMAPPED_MIDI_ASSET_FILES).toEqual(['horetzky21.mid']);
  });

  it('conserve des alias legacy pour compatibilité', () => {
    expect(ROOT_MIDI_ASSET_INTEGRATIONS).toBe(MIDI_ASSET_INTEGRATIONS);
    expect(UNMAPPED_ROOT_MIDI_FILES).toBe(UNMAPPED_MIDI_ASSET_FILES);
  });
});
