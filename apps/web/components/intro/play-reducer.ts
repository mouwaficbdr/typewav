/**
 * Logique pure de l'écran 2 de l'Ouverture (« joue »). Aucune dépendance :
 * le rendu (`PlayScreen`, tâche 14) l'appelle et traduit l'effet en note,
 * écho ou reprise via le moteur audio.
 */

export type PlayPhase = 'typing' | 'askMiss' | 'waiting' | 'resumed';

export interface PlayState {
  phase: PlayPhase;
  typed: number;
}

export type PlayInput = { kind: 'char'; char: string } | { kind: 'backspace' };

export type PlayEffect =
  | { kind: 'note'; index: number }
  | { kind: 'echo' }
  | { kind: 'resume' }
  | null;

export const INITIAL_PLAY: PlayState = { phase: 'typing', typed: 0 };

export function playStep(
  state: PlayState,
  input: PlayInput,
  text: string,
): { state: PlayState; effect: PlayEffect } {
  switch (state.phase) {
    case 'typing': {
      if (input.kind === 'backspace') {
        return { state, effect: null };
      }
      if (input.char === text[state.typed]) {
        const typed = state.typed + 1;
        const phase: PlayPhase = typed === text.length ? 'askMiss' : 'typing';
        return {
          state: { phase, typed },
          effect: { kind: 'note', index: state.typed },
        };
      }
      return { state, effect: state.typed > 0 ? { kind: 'echo' } : null };
    }
    case 'askMiss': {
      if (input.kind === 'backspace') {
        return { state, effect: null };
      }
      return { state: { ...state, phase: 'waiting' }, effect: { kind: 'echo' } };
    }
    case 'waiting': {
      if (input.kind === 'backspace') {
        return {
          state: { ...state, phase: 'resumed' },
          effect: { kind: 'resume' },
        };
      }
      return { state, effect: { kind: 'echo' } };
    }
    case 'resumed': {
      return { state, effect: null };
    }
  }
}
