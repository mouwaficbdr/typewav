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
    sourceFileName: '86_eighty_six_avid.mid',
    pieceId: 'avid-86',
    publicPath: '/midi/86_eighty_six_avid.mid',
  },
  {
    sourceFileName: 'beethoven_fifth_op67.mid',
    pieceId: 'symphony-5-theme',
    publicPath: '/midi/beethoven_fifth_op67.mid',
  },
  {
    sourceFileName: 'binks_sake.mid',
    pieceId: 'binks-sake',
    publicPath: '/midi/binks_sake.mid',
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
    sourceFileName: 'ezios_family.mid',
    pieceId: 'ezios-family',
    publicPath: '/midi/ezios_family.mid',
  },
  {
    sourceFileName: 'fur_Elise_WoO59.mid',
    pieceId: 'fur-elise',
    publicPath: '/midi/fur_Elise_WoO59.mid',
  },
  {
    sourceFileName: 'giornos_theme.mid',
    pieceId: 'giornos-theme',
    publicPath: '/midi/giornos_theme.mid',
  },
  {
    sourceFileName: 'glassy_sky.mid',
    pieceId: 'glassy-sky',
    publicPath: '/midi/glassy_sky.mid',
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
    sourceFileName: 'in_time_of_war.mid',
    pieceId: 'in-time-of-war',
    publicPath: '/midi/in_time_of_war.mid',
  },
  {
    sourceFileName: 'kaijuu_orb.mid',
    pieceId: 'kaijuu-orb',
    publicPath: '/midi/kaijuu_orb.mid',
  },
  {
    sourceFileName: 'kimi_no_na_wa_date_2.mid',
    pieceId: 'date-2',
    publicPath: '/midi/kimi_no_na_wa_date_2.mid',
  },
  {
    sourceFileName: 'kokuten.mid',
    pieceId: 'kokuten',
    publicPath: '/midi/kokuten.mid',
  },
  {
    sourceFileName: 'KV331_3_RondoAllaTurca.mid',
    pieceId: 'rondo-alla-turca',
    publicPath: '/midi/KV331_3_RondoAllaTurca.mid',
  },
  {
    sourceFileName: 'lit_a_silent_voice.mid',
    pieceId: 'lit-a-silent-voice',
    publicPath: '/midi/lit_a_silent_voice.mid',
  },
  {
    sourceFileName: 'next_to_you_parasyte.mid',
    pieceId: 'next-to-you',
    publicPath: '/midi/next_to_you_parasyte.mid',
  },
  {
    sourceFileName: 'ode.mid',
    pieceId: 'ode-to-joy',
    publicPath: '/midi/ode.mid',
  },
  {
    sourceFileName: 'sadness_and_sorrow.mid',
    pieceId: 'sadness-and-sorrow',
    publicPath: '/midi/sadness_and_sorrow.mid',
  },
  {
    sourceFileName: 'saitama_theme.mid',
    pieceId: 'saitama-theme',
    publicPath: '/midi/saitama_theme.mid',
  },
  {
    sourceFileName: 'SchubertF-D839_AveMaria.mid',
    pieceId: 'ave-maria',
    publicPath: '/midi/SchubertF-D839_AveMaria.mid',
  },
  {
    sourceFileName: 'soundscape_to_ardor.mid',
    pieceId: 'soundscape-to-ardor',
    publicPath: '/midi/soundscape_to_ardor.mid',
  },
  {
    sourceFileName: 'ToccataFugue.mid',
    pieceId: 'toccata-fugue',
    publicPath: '/midi/ToccataFugue.mid',
  },
  {
    sourceFileName: 'unravel_tokyo_ghoul.mid',
    pieceId: 'unravel-tokyo-ghoul',
    publicPath: '/midi/unravel_tokyo_ghoul.mid',
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
