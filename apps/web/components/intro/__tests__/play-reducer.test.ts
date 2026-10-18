import { describe, expect, it } from 'vitest';
import { INITIAL_PLAY, playStep, type PlayState } from '../play-reducer';

const TEXT = 'les notes';

describe('playStep', () => {
  it('typing, typed < 9, char attendu : avance, joue la note à cet index', () => {
    const { state, effect } = playStep(INITIAL_PLAY, { kind: 'char', char: 'l' }, TEXT);
    expect(state).toEqual({ phase: 'typing', typed: 1 });
    expect(effect).toEqual({ kind: 'note', index: 0 });
  });

  it('typing, autre char, rien tapé encore : aucun effet', () => {
    const { state, effect } = playStep(INITIAL_PLAY, { kind: 'char', char: 'z' }, TEXT);
    expect(state).toEqual(INITIAL_PLAY);
    expect(effect).toBeNull();
  });

  it('typing, autre char, déjà tapé au moins une lettre : écho', () => {
    const mid: PlayState = { phase: 'typing', typed: 2 };
    const { state, effect } = playStep(mid, { kind: 'char', char: 'z' }, TEXT);
    expect(state).toEqual(mid);
    expect(effect).toEqual({ kind: 'echo' });
  });

  it('typing, backspace : inchangé, aucun effet', () => {
    const mid: PlayState = { phase: 'typing', typed: 2 };
    const { state, effect } = playStep(mid, { kind: 'backspace' }, TEXT);
    expect(state).toEqual(mid);
    expect(effect).toBeNull();
  });

  it("askMiss, n'importe quel char : passe à waiting, écho", () => {
    const atAskMiss: PlayState = { phase: 'askMiss', typed: 9 };
    const { state, effect } = playStep(atAskMiss, { kind: 'char', char: 'x' }, TEXT);
    expect(state).toEqual({ phase: 'waiting', typed: 9 });
    expect(effect).toEqual({ kind: 'echo' });
  });

  it('askMiss, backspace : inchangé, aucun effet', () => {
    const atAskMiss: PlayState = { phase: 'askMiss', typed: 9 };
    const { state, effect } = playStep(atAskMiss, { kind: 'backspace' }, TEXT);
    expect(state).toEqual(atAskMiss);
    expect(effect).toBeNull();
  });

  it('waiting, backspace : passe à resumed, effet resume', () => {
    const atWaiting: PlayState = { phase: 'waiting', typed: 9 };
    const { state, effect } = playStep(atWaiting, { kind: 'backspace' }, TEXT);
    expect(state).toEqual({ phase: 'resumed', typed: 9 });
    expect(effect).toEqual({ kind: 'resume' });
  });

  it('waiting, char : inchangé, écho', () => {
    const atWaiting: PlayState = { phase: 'waiting', typed: 9 };
    const { state, effect } = playStep(atWaiting, { kind: 'char', char: 'x' }, TEXT);
    expect(state).toEqual(atWaiting);
    expect(effect).toEqual({ kind: 'echo' });
  });

  it('resumed, tout : inchangé, aucun effet', () => {
    const atResumed: PlayState = { phase: 'resumed', typed: 9 };
    expect(playStep(atResumed, { kind: 'char', char: 'x' }, TEXT)).toEqual({
      state: atResumed,
      effect: null,
    });
    expect(playStep(atResumed, { kind: 'backspace' }, TEXT)).toEqual({
      state: atResumed,
      effect: null,
    });
  });

  it('les 9 caractères de « les notes » mènent à askMiss', () => {
    let state: PlayState = INITIAL_PLAY;
    for (const char of TEXT) {
      ({ state } = playStep(state, { kind: 'char', char }, TEXT));
    }
    expect(state).toEqual({ phase: 'askMiss', typed: 9 });
  });

  it("une majuscule n'est pas égale à sa minuscule", () => {
    const { state, effect } = playStep(INITIAL_PLAY, { kind: 'char', char: 'L' }, TEXT);
    expect(state).toEqual(INITIAL_PLAY);
    expect(effect).toBeNull();
  });

  it('typed ne dépasse jamais text.length', () => {
    const atAskMiss: PlayState = { phase: 'askMiss', typed: 9 };
    const { state } = playStep(atAskMiss, { kind: 'char', char: 'x' }, TEXT);
    expect(state.typed).toBeLessThanOrEqual(TEXT.length);
  });
});
