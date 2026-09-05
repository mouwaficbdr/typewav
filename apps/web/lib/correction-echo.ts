/**
 * Décide quand jouer le micro-écho de reverb signalant une correction.
 *
 * L'écho ne doit se déclencher que sur le vrai chemin de correction :
 * un Backspace qui retire une frappe fausse, immédiatement suivi d'une
 * frappe correcte. Comparer seulement "la dernière frappe de l'historique
 * était fausse" (sans passer par Backspace) déclenche l'écho sur le
 * mauvais chemin : voir TypeWav-Etat-des-lieux.docx §1.
 */
export class CorrectionEchoTracker {
  private armed = false;

  /** Appelé quand l'utilisateur presse Backspace, avec la frappe retirée. */
  onBackspace(removedKeystroke: { correct: boolean } | undefined): void {
    this.armed = removedKeystroke !== undefined && !removedKeystroke.correct;
  }

  /**
   * Appelé à chaque frappe (hors Backspace). Retourne true une seule fois,
   * si cette frappe correcte complète une correction armée par Backspace.
   */
  onKeystroke(isCorrect: boolean): boolean {
    if (!isCorrect) {
      this.armed = false;
      return false;
    }
    const shouldFire = this.armed;
    this.armed = false;
    return shouldFire;
  }
}
