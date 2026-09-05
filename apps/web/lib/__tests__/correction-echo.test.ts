import { describe, expect, it } from 'vitest';
import { CorrectionEchoTracker } from '../correction-echo';

describe('CorrectionEchoTracker', () => {
  it('ne se déclenche pas sur une frappe correcte sans backspace préalable', () => {
    const tracker = new CorrectionEchoTracker();
    expect(tracker.onKeystroke(true)).toBe(false);
  });

  it('se déclenche quand un backspace retire une erreur puis la bonne touche est tapée', () => {
    const tracker = new CorrectionEchoTracker();
    tracker.onBackspace({ correct: false });
    expect(tracker.onKeystroke(true)).toBe(true);
  });

  it('ne se déclenche pas si le backspace retirait une frappe déjà correcte', () => {
    const tracker = new CorrectionEchoTracker();
    tracker.onBackspace({ correct: true });
    expect(tracker.onKeystroke(true)).toBe(false);
  });

  it("ne se déclenche pas quand on tape une touche fausse après une frappe fausse : sans backspace (chemin invalide)", () => {
    const tracker = new CorrectionEchoTracker();
    // Aucun backspace n'a eu lieu : la frappe précédente était fausse dans
    // l'historique, mais ce n'est pas une correction.
    expect(tracker.onKeystroke(false)).toBe(false);
    expect(tracker.onKeystroke(true)).toBe(false);
  });

  it("ne se déclenche qu'une seule fois par correction", () => {
    const tracker = new CorrectionEchoTracker();
    tracker.onBackspace({ correct: false });
    expect(tracker.onKeystroke(true)).toBe(true);
    expect(tracker.onKeystroke(true)).toBe(false);
  });

  it("une frappe fausse après le backspace désarme la correction en attente", () => {
    const tracker = new CorrectionEchoTracker();
    tracker.onBackspace({ correct: false });
    expect(tracker.onKeystroke(false)).toBe(false);
    expect(tracker.onKeystroke(true)).toBe(false);
  });

  it("un backspace sans frappe précédente ne déclenche rien", () => {
    const tracker = new CorrectionEchoTracker();
    tracker.onBackspace(undefined);
    expect(tracker.onKeystroke(true)).toBe(false);
  });
});
