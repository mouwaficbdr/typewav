import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '../useSessionStore';

// Réccupérer l'état initial du store avant chaque test
beforeEach(() => {
  useSessionStore.getState().reset();
});

describe('useSessionStore : recordKeystroke', () => {
  it('la session démarre avec startedAt à null', () => {
    useSessionStore.getState().startSession('abc');
    expect(useSessionStore.getState().startedAt).toBeNull();
  });

  it('initialise startedAt à la première frappe', () => {
    useSessionStore.getState().startSession('abc');
    useSessionStore.getState().recordKeystroke({
      char: 'a',
      timestamp: 1234,
      correct: true,
      deltaMs: 0,
    });

    expect(useSessionStore.getState().startedAt).toBe(1234);
  });

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

  it('termine la séance quand tout le texte est tapé (mode sur complétion)', () => {
    useSessionStore.getState().startSession('ab', { mode: 'sprint' });
    useSessionStore.getState().recordKeystroke({
      char: 'a',
      timestamp: 1000,
      correct: true,
      deltaMs: 0,
    });
    expect(useSessionStore.getState().endedAt).toBeNull();
    useSessionStore.getState().recordKeystroke({
      char: 'b',
      timestamp: 1100,
      correct: true,
      deltaMs: 100,
    });
    expect(useSessionStore.getState().endedAt).not.toBeNull();
  });

  it('en mode Temps (classic), atteindre la fin du texte ne termine PAS la séance : seul le chrono le fait', () => {
    useSessionStore.getState().startSession('ab', { mode: 'classic' });
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
    expect(useSessionStore.getState().position).toBe(2);
    expect(useSessionStore.getState().endedAt).toBeNull();
  });
});

describe('useSessionStore : moveBack', () => {
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
    // mode sur complétion : la fin de texte termine la séance.
    useSessionStore.getState().startSession('a', { mode: 'sprint' });
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

describe('useSessionStore : endSession', () => {
  it("ne modifie pas endedAt si endSession est appelée une seconde fois", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);

    useSessionStore.getState().startSession('abcdef');
    useSessionStore.getState().endSession();
    const firstEndedAt = useSessionStore.getState().endedAt;
    expect(firstEndedAt).toBe(1_000);

    vi.setSystemTime(5_000);
    useSessionStore.getState().endSession();

    expect(useSessionStore.getState().endedAt).toBe(firstEndedAt);

    vi.useRealTimers();
  });
});

describe('useSessionStore : noteEvents', () => {
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
