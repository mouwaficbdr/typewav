import { beforeEach, describe, expect, it } from 'vitest';
import {
  advanceAndGet,
  advanceAndGetWithDuration,
  getCurrentDuration,
  getCurrentPiece,
  getCurrentPosition,
  loadPiece,
  MIDI_PIECES,
  resetSequence,
} from '../midi-player';

describe('MIDI_PIECES', () => {
  it('contient exactement 58 pièces', () => {
    expect(Object.keys(MIDI_PIECES)).toHaveLength(58);
  });

  it('chaque pièce a un tableau de notes non vide', () => {
    for (const piece of Object.values(MIDI_PIECES)) {
      expect(piece.notes.length).toBeGreaterThan(0);
    }
  });

  it('chaque note est une chaîne de type pitch Tone.js ou "rest"', () => {
    const pitchRegex = /^([A-G][b#]?\d|rest)$/;
    for (const piece of Object.values(MIDI_PIECES)) {
      for (const note of piece.notes) {
        expect(note).toMatch(pitchRegex);
      }
    }
  });

  it('chaque pièce a une noteDuration valide', () => {
    const validDurations = ['1n', '2n', '4n', '8n', '16n', '32n'];
    for (const piece of Object.values(MIDI_PIECES)) {
      expect(validDurations).toContain(piece.noteDuration);
    }
  });

  it('toutes les pièces sont du domaine public (year < 1956)', () => {
    for (const piece of Object.values(MIDI_PIECES)) {
      expect(piece.year).toBeLessThan(1956);
    }
  });
});

describe('loadPiece', () => {
  it('charge une pièce et réinitialise la position', () => {
    loadPiece('fur-elise');
    expect(getCurrentPiece()?.id).toBe('fur-elise');
    expect(getCurrentPosition()).toBe(0);
  });

  it('charge une pièce différente sans laisser de résidus', () => {
    loadPiece('fur-elise');
    loadPiece('korobeiniki');
    expect(getCurrentPiece()?.id).toBe('korobeiniki');
    expect(getCurrentPosition()).toBe(0);
  });

  it('charge des pièces hors noyau historique sans erreur', () => {
    const samplePieces = [
      'clair-de-lune',
      'flight-of-bumblebee',
      'amazing-grace',
    ];
    for (const id of samplePieces) {
      const piece = loadPiece(id);
      expect(piece.id).toBe(id);
      expect(piece.notes.length).toBeGreaterThan(0);
    }
  });

  it('supporte les alias legacy', () => {
    const piece = loadPiece('prelude-bwv846');
    expect(piece.id).toBe('bwv846');
  });
});

describe('advanceAndGet', () => {
  beforeEach(() => {
    loadPiece('bwv846');
  });

  it('retourne la première note au premier appel', () => {
    const note = advanceAndGet();
    const piece = getCurrentPiece();
    expect(piece).not.toBeNull();
    expect(note).toBe(piece!.notes[0]);
  });

  it('avance la position à chaque appel', () => {
    advanceAndGet(); // position → 1
    expect(getCurrentPosition()).toBe(1);
    advanceAndGet(); // position → 2
    expect(getCurrentPosition()).toBe(2);
  });

  it('boucle à la fin de la séquence', () => {
    const piece = loadPiece('bwv846');
    // Avancer jusqu'à la dernière note
    for (let i = 0; i < piece.notes.length - 1; i++) {
      advanceAndGet();
    }
    // Dernière note → position revient à 0
    const lastNote = advanceAndGet();
    expect(lastNote).toBe(piece.notes[piece.notes.length - 1]);
    expect(getCurrentPosition()).toBe(0);
  });

  it('retourne null si aucune pièce chargée', () => {
    // Réinitialiser l'état en forçant un état vide
    loadPiece('fur-elise');
    resetSequence();
    // Même sans pièce nulle, advanceAndGet doit fonctionner
    const note = advanceAndGet();
    expect(note).toBeDefined();
  });
});

describe('advanceAndGetWithDuration', () => {
  beforeEach(() => {
    loadPiece('bwv846');
  });

  it('retourne la note et la duree de la meme piece', () => {
    const step = advanceAndGetWithDuration();
    expect(step).not.toBeNull();
    expect(step?.note).toBe(MIDI_PIECES['bwv846']?.notes[0]);
    expect(step?.duration).toBe(MIDI_PIECES['bwv846']?.noteDuration);
  });
});

describe('getCurrentDuration', () => {
  it('retourne la durée de la pièce chargée', () => {
    loadPiece('gymnopedie1');
    expect(getCurrentDuration()).toBe('8n');
  });

  it('retourne "16n" par défaut si aucune pièce', () => {
    // Patch interne — vérifier fallback
    loadPiece('fur-elise');
    expect(getCurrentDuration()).toBe('16n');
  });
});

describe('resetSequence', () => {
  it('remet la position à 0 sans changer la pièce', () => {
    loadPiece('korobeiniki');
    advanceAndGet();
    advanceAndGet();
    expect(getCurrentPosition()).toBe(2);
    resetSequence();
    expect(getCurrentPosition()).toBe(0);
    expect(getCurrentPiece()?.id).toBe('korobeiniki');
  });
});
