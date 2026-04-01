import type { MidiPieceId } from './midi-player';

export interface MidiAssetIntegration {
  sourceFileName: string;
  /** null = fichier présent mais non mappé à une pièce canonique. */
  pieceId: MidiPieceId | null;
  publicPath: string;
}

/**
 * Intégration des fichiers .mid servis par Next.js depuis apps/web/public/midi.
 */
export const MIDI_ASSET_INTEGRATIONS: readonly MidiAssetIntegration[] = [
  {
    sourceFileName: 'beethoven_fifth_op67.mid',
    pieceId: 'symphony-5-theme',
    publicPath: '/midi/beethoven_fifth_op67.mid',
  },
  {
    sourceFileName: 'CanonInD.mid',
    pieceId: 'canon-in-d',
    publicPath: '/midi/CanonInD.mid',
  },
  {
    sourceFileName: 'Dans_l_antre_du_roi_de_la_montagne.mid',
    pieceId: 'mountain-king',
    publicPath: '/midi/Dans_l_antre_du_roi_de_la_montagne.mid',
  },
  {
    sourceFileName: 'fur_Elise_WoO59.mid',
    pieceId: 'fur-elise',
    publicPath: '/midi/fur_Elise_WoO59.mid',
  },
  {
    sourceFileName: 'gymnopedie_1.mid',
    pieceId: 'gymnopedie1',
    publicPath: '/midi/gymnopedie_1.mid',
  },
  {
    sourceFileName: 'horetzky21.mid',
    pieceId: null,
    publicPath: '/midi/horetzky21.mid',
  },
  {
    sourceFileName: 'KV331_3_RondoAllaTurca.mid',
    pieceId: 'rondo-alla-turca',
    publicPath: '/midi/KV331_3_RondoAllaTurca.mid',
  },
  {
    sourceFileName: 'ode.mid',
    pieceId: 'ode-to-joy',
    publicPath: '/midi/ode.mid',
  },
  {
    sourceFileName: 'SchubertF-D839_AveMaria.mid',
    pieceId: 'ave-maria',
    publicPath: '/midi/SchubertF-D839_AveMaria.mid',
  },
  {
    sourceFileName: 'ToccataFugue.mid',
    pieceId: 'toccata-fugue',
    publicPath: '/midi/ToccataFugue.mid',
  },
];

const MIDI_ASSET_BY_PIECE_ID = new Map<MidiPieceId, string>(
  MIDI_ASSET_INTEGRATIONS.filter(
    (entry): entry is MidiAssetIntegration & { pieceId: MidiPieceId } =>
      entry.pieceId !== null,
  ).map((entry) => [entry.pieceId, entry.publicPath]),
);

export const UNMAPPED_MIDI_ASSET_FILES = MIDI_ASSET_INTEGRATIONS.filter(
  (entry) => entry.pieceId === null,
).map((entry) => entry.sourceFileName);

/** @deprecated Utiliser MIDI_ASSET_INTEGRATIONS. */
export const ROOT_MIDI_ASSET_INTEGRATIONS = MIDI_ASSET_INTEGRATIONS;

/** @deprecated Utiliser UNMAPPED_MIDI_ASSET_FILES. */
export const UNMAPPED_ROOT_MIDI_FILES = UNMAPPED_MIDI_ASSET_FILES;

export function getMidiAssetPath(pieceId: MidiPieceId): string | null {
  return MIDI_ASSET_BY_PIECE_ID.get(pieceId) ?? null;
}
