import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from '../useSessionStore';

// Réccupérer l'état initial du store avant chaque test
beforeEach(() => {
  useSessionStore.getState().reset();
});

describe('useSessionStore — recordKeystroke', () => {
  it('incrémente position si la frappe est correcte', () => {
    useSessionStore.getState().startSession('abc');
    useSessionStore.getState().recordKeystroke({
      char: 'a',
      timestamp: 1000,
      correct: true,
      deltaMs: 0,
    });
    expect(useSessionStore.getState().position).toBe(1);
  });

  it("incrémente aussi position si la frappe n'est pas correcte", () => {
    useSessionStore.getState().startSession('abc');
    useSessionStore.getState().recordKeystroke({
      char: 'x',
      timestamp: 1000,
      correct: false,
      deltaMs: 0,
    });
    expect(useSessionStore.getState().position).toBe(1);
  });
});

describe('useSessionStore — moveBack', () => {
  it('décrémente position de 1 après des frappes', () => {
    // Texte long pour ne pas terminer la session avant moveBack
    useSessionStore.getState().startSession('abcdef');
    useSessionStore.getState().recordKeystroke({
      char: 'a',
      timestamp: 1000,
      correct: true,
      deltaMs: 0,
    });
    useSessionStore.getState().recordKeystroke({
      char: 'b',
      timestamp: 1100,
      correct: true,
      deltaMs: 100,
    });
    useSessionStore.getState().recordKeystroke({
      char: 'c',
      timestamp: 1200,
      correct: true,
      deltaMs: 100,
    });

    expect(useSessionStore.getState().position).toBe(3);
    useSessionStore.getState().moveBack();
    expect(useSessionStore.getState().position).toBe(2);
  });

  it('retire le dernier keystroke du tableau', () => {
    // Texte long pour ne pas terminer la session avant moveBack
    useSessionStore.getState().startSession('abcdef');
    useSessionStore.getState().recordKeystroke({
      char: 'a',
      timestamp: 1000,
      correct: true,
      deltaMs: 0,
    });
    useSessionStore.getState().recordKeystroke({
      char: 'b',
      timestamp: 1100,
      correct: true,
      deltaMs: 100,
    });
    useSessionStore.getState().recordKeystroke({
      char: 'c',
      timestamp: 1200,
      correct: true,
      deltaMs: 100,
    });

    expect(useSessionStore.getState().keystrokes).toHaveLength(3);
    useSessionStore.getState().moveBack();
    expect(useSessionStore.getState().keystrokes).toHaveLength(2);
  });

  it('ne fait rien si position === 0', () => {
    useSessionStore.getState().startSession('abc');
    expect(useSessionStore.getState().position).toBe(0);
    useSessionStore.getState().moveBack();
    expect(useSessionStore.getState().position).toBe(0);
    expect(useSessionStore.getState().keystrokes).toHaveLength(0);
  });

  it('ne fait rien si la session est terminée (endedAt !== null)', () => {
    useSessionStore.getState().startSession('a');
    useSessionStore.getState().recordKeystroke({
      char: 'a',
      timestamp: 1000,
      correct: true,
      deltaMs: 0,
    });

    // La session se termine automatiquement quand position >= text.length
    expect(useSessionStore.getState().endedAt).not.toBeNull();
    const positionBeforeBack = useSessionStore.getState().position;
    const keystrokesBeforeBack = useSessionStore.getState().keystrokes.length;

    useSessionStore.getState().moveBack();

    expect(useSessionStore.getState().position).toBe(positionBeforeBack);
    expect(useSessionStore.getState().keystrokes).toHaveLength(
      keystrokesBeforeBack,
    );
  });

  it('peut revenir sur une erreur', () => {
    useSessionStore.getState().startSession('abc');
    // Frappe incorrecte (position avance à 1)
    useSessionStore.getState().recordKeystroke({
      char: 'x',
      timestamp: 1000,
      correct: false,
      deltaMs: 0,
    });
    expect(useSessionStore.getState().position).toBe(1);
    expect(useSessionStore.getState().keystrokes).toHaveLength(1);

    useSessionStore.getState().moveBack();
    expect(useSessionStore.getState().position).toBe(0);
    expect(useSessionStore.getState().keystrokes).toHaveLength(0);
  });
});

describe('useSessionStore — noteEvents', () => {
  it('recordNoteEvent ajoute un événement au tableau', () => {
    useSessionStore.getState().startSession('abc');
    useSessionStore.getState().recordNoteEvent('C4', 0);
    expect(useSessionStore.getState().noteEvents).toHaveLength(1);
    expect(useSessionStore.getState().noteEvents[0]!.noteName).toBe('C4');
    expect(useSessionStore.getState().noteEvents[0]!.charIndex).toBe(0);
    expect(useSessionStore.getState().noteEvents[0]!.isError).toBe(false);
  });

  it('reset vide noteEvents', () => {
    useSessionStore.getState().startSession('abc');
    useSessionStore.getState().recordNoteEvent('G4', 1);
    useSessionStore.getState().reset();
    expect(useSessionStore.getState().noteEvents).toHaveLength(0);
  });

  it('startSession remet noteEvents à zéro', () => {
    useSessionStore.getState().startSession('abc');
    useSessionStore.getState().recordNoteEvent('E4', 0);
    useSessionStore.getState().startSession('def');
    expect(useSessionStore.getState().noteEvents).toHaveLength(0);
  });
});
