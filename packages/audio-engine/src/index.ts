export type { NoteWithOctave, PentatonicNote } from './pentatonic';

export {
  PENTATONIC_NOTES,
  getChordPentatonicNotes,
  getPentatonicNote,
  isPentatonicNote,
} from './pentatonic';

export type {
  Chord,
  ChordProgression,
  ChordProgressionTheme,
} from './chord-progressions';

export {
  getAvailableThemes,
  getChordAtIndex,
  getChordProgression,
} from './chord-progressions';

export type { AudioEngine } from './engine';

export type { MidiPiece, MidiPieceId, SequencedMidiNote } from './midi-player';

export {
  MIDI_PIECES,
  advanceAndGet,
  advanceAndGetWithDuration,
  clearLoadedPiece,
  getCurrentDuration,
  getCurrentPiece,
  getCurrentPosition,
  loadPiece,
  loadPieceFromData,
  resetSequence,
} from './midi-player';

export type { MidiAssetIntegration } from './midi-assets';

export {
  MIDI_ASSET_INTEGRATIONS,
  ROOT_MIDI_ASSET_INTEGRATIONS,
  UNMAPPED_MIDI_ASSET_FILES,
  UNMAPPED_ROOT_MIDI_FILES,
  getMidiAssetPath,
} from './midi-assets';

export type { EmotionalRegister, MusicPiece } from './library';

export { MUSIC_LIBRARY, MUSIC_LIBRARY_MAP } from './library';

export type { UnifiedMusicPiece } from './music-catalog';

export {
  MIDI_TO_LIBRARY_ID,
  getLibraryIdFromMidiPieceId,
  getMidiPieceIdFromLibraryId,
  getPlayableMusicLibrary,
  getUnifiedMusicLibrary,
  getUnifiedPieceByMidiId,
  isMidiPieceMapped,
} from './music-catalog';

export type { CollectionId } from './recommendation';

export {
  getRecommendedPiece,
  getRecommendedRegister,
  pickPiece,
} from './recommendation';
