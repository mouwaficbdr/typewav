import { beforeEach, describe, expect, it } from 'vitest';
import {
  advanceAndGet,
  advanceAndGetNote,
  advanceAndGetWithDuration,
  getCurrentDuration,
  getCurrentPiece,
  getCurrentPosition,
  loadPiece,
  loadPieceFromData,
  MIDI_PIECES,
  resetSequence,
  type ParsedPiece,
} from '../midi-player';

describe('MIDI_PIECES', () => {
  it('contient exactement 24 pièces', () => {
    expect(Object.keys(MIDI_PIECES)).toHaveLength(24);
  });

  it('chaque pièce a des notes parsées valides', () => {
    for (const piece of Object.values(MIDI_PIECES)) {
      expect(piece.notes.length).toBeGreaterThan(0);
      expect(piece.bpmReference).toBeGreaterThan(0);
      expect(piece.ppq).toBeGreaterThan(0);
      expect(piece.totalDurationSec).toBeGreaterThan(0);

      for (const note of piece.notes) {
        expect(note.pitch).toBeGreaterThanOrEqual(0);
        expect(note.pitch).toBeLessThanOrEqual(127);
        expect(note.durationSec).toBeGreaterThan(0);
        expect(note.durationTicks).toBeGreaterThan(0);
        expect(note.startTick).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('loadPiece', () => {
  it('charge une pièce et réinitialise la position', () => {
    loadPiece('fur-elise');
    expect(getCurrentPiece()?.id).toBe('fur-elise');
    expect(getCurrentPosition()).toBe(0);
  });

  it('supporte les alias legacy', () => {
    const piece = loadPiece('canon-pachelbel');
    expect(piece.id).toBe('canon-in-d');
  });
});

describe('advanceAndGetNote', () => {
  beforeEach(() => {
    loadPiece('canon-in-d');
  });

  it('retourne une note parsée au premier appel', () => {
    const note = advanceAndGetNote();
    const piece = getCurrentPiece();

    expect(piece).not.toBeNull();
    expect(note).toEqual(piece?.notes[0]);
  });

  it('avance la position à chaque appel', () => {
    advanceAndGetNote();
    expect(getCurrentPosition()).toBe(1);
    advanceAndGetNote();
    expect(getCurrentPosition()).toBe(2);
  });

  it('boucle à la fin de la séquence', () => {
    const piece = loadPiece('canon-in-d');

    for (let i = 0; i < piece.notes.length - 1; i++) {
      advanceAndGetNote();
    }

    const last = advanceAndGetNote();
    expect(last).toEqual(piece.notes[piece.notes.length - 1]);
    expect(getCurrentPosition()).toBe(0);
  });
});

describe('legacy compatibility', () => {
  beforeEach(() => {
    loadPiece('canon-in-d');
  });

  it('advanceAndGet retourne un nom de note Tone-compatible', () => {
    const noteName = advanceAndGet();
    expect(noteName).toMatch(/^([A-G]#?\d)$/);
  });

  it('advanceAndGetWithDuration retourne note+durée legacy', () => {
    const step = advanceAndGetWithDuration();
    expect(step).not.toBeNull();
    expect(step?.note).toMatch(/^([A-G]#?\d)$/);
    expect(step?.duration).toMatch(/^(1n|2n|4n|8n|16n|32n)$/);
  });

  it('getCurrentDuration retourne une durée valide', () => {
    const duration = getCurrentDuration();
    expect(duration).toMatch(/^(1n|2n|4n|8n|16n|32n)$/);
  });
});

describe('loadPieceFromData', () => {
  it('charge une pièce parsée dynamique', () => {
    const piece: ParsedPiece = {
      id: 'custom',
      title: 'Custom',
      composer: 'TypeWav',
      year: 1900,
      bpmReference: 110,
      ppq: 480,
      totalDurationSec: 1,
      notes: [
        {
          pitch: 60,
          durationSec: 0.5,
          durationTicks: 240,
          startTick: 0,
          velocity: 100,
          isPhraseBoundary: false,
        },
        {
          pitch: 64,
          durationSec: 0.5,
          durationTicks: 240,
          startTick: 240,
          velocity: 96,
          isPhraseBoundary: true,
        },
      ],
    };

    loadPieceFromData(piece);
    expect(getCurrentPiece()?.id).toBe('custom');
    expect(getCurrentPosition()).toBe(0);
  });
});

describe('resetSequence', () => {
  it('remet la position à 0 sans changer la pièce', () => {
    loadPiece('ode-to-joy');
    advanceAndGetNote();
    advanceAndGetNote();
    expect(getCurrentPosition()).toBe(2);

    resetSequence();

    expect(getCurrentPosition()).toBe(0);
    expect(getCurrentPiece()?.id).toBe('ode-to-joy');
  });
});
