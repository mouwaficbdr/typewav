const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const DEFAULT_MIDI_MIN = 21;
const DEFAULT_MIDI_MAX = 108;

export interface NotePitchMappingOptions {
  midiMin?: number;
  midiMax?: number;
  // Compat legacy:
  baseMidi?: number;
  semitoneSpan?: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resolveRange(options: NotePitchMappingOptions): {
  midiMin: number;
  midiMax: number;
} {
  const hasLegacyRange =
    typeof options.baseMidi === 'number' ||
    typeof options.semitoneSpan === 'number';

  if (hasLegacyRange) {
    const base = options.baseMidi ?? DEFAULT_MIDI_MIN;
    const span = options.semitoneSpan ?? DEFAULT_MIDI_MAX - DEFAULT_MIDI_MIN;
    return {
      midiMin: base,
      midiMax: base + Math.max(1, span),
    };
  }

  return {
    midiMin: options.midiMin ?? DEFAULT_MIDI_MIN,
    midiMax: options.midiMax ?? DEFAULT_MIDI_MAX,
  };
}

export function noteNameToMidi(noteName: string): number | null {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(noteName.trim());
  if (!match) return null;

  const pitchClass = match[1]?.toUpperCase() ?? '';
  const accidental = match[2] ?? '';
  const octave = Number(match[3]);

  if (!Number.isFinite(octave)) return null;

  const baseOffset = NOTE_OFFSETS[pitchClass];
  if (baseOffset === undefined) return null;

  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;

  return (octave + 1) * 12 + baseOffset + accidentalOffset;
}

export function getPitchPositionFromMidi(
  pitch: number,
  options: NotePitchMappingOptions = {},
): number | null {
  if (!Number.isFinite(pitch)) return null;

  const { midiMin, midiMax } = resolveRange(options);
  const range = midiMax - midiMin;
  if (range <= 0) return null;

  return clamp01((pitch - midiMin) / range);
}

export function getNotePitchPosition(
  noteName: string,
  options: NotePitchMappingOptions = {},
): number | null {
  const midi = noteNameToMidi(noteName);
  if (midi === null) return null;

  return getPitchPositionFromMidi(midi, options);
}

export function mapPitchToBarIndex(
  pitch: number,
  barCount: number,
  options: NotePitchMappingOptions = {},
): number | null {
  if (barCount <= 0) return null;
  if (barCount === 1) return 0;

  const position = getPitchPositionFromMidi(pitch, options);
  if (position === null) return null;

  return Math.round(position * (barCount - 1));
}

export function mapNoteToBarIndex(
  noteName: string,
  barCount: number,
  options: NotePitchMappingOptions = {},
): number | null {
  const midi = noteNameToMidi(noteName);
  if (midi === null) return null;

  return mapPitchToBarIndex(midi, barCount, options);
}

export function mapPitchToBarHeight(
  pitch: number,
  minHeight: number,
  maxHeight: number,
  options: NotePitchMappingOptions = {},
): number {
  const low = Math.min(minHeight, maxHeight);
  const high = Math.max(minHeight, maxHeight);
  const position = getPitchPositionFromMidi(pitch, options);

  if (position === null) return low;

  return low + Math.round(position * (high - low));
}

export function mapNoteToBarHeight(
  noteName: string,
  minHeight: number,
  maxHeight: number,
  options: NotePitchMappingOptions = {},
): number {
  const midi = noteNameToMidi(noteName);
  if (midi === null) return Math.min(minHeight, maxHeight);

  return mapPitchToBarHeight(midi, minHeight, maxHeight, options);
}
