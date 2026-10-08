/**
 * Le Conservatoire : modèle de maîtrise par geste.
 * Spec : docs/superpowers/specs/2026-10-08-conservatoire-v1-design.md, partie 1.
 */

/** Une frappe sur un geste : juste ou non, et le temps écoulé depuis la frappe précédente. */
export interface Attempt {
  correct: boolean;
  /** `null` en début d'exercice, après une pause de plus de 3 s, ou si l'horloge recule. */
  latencyMs: number | null;
  at: number;
}

export interface GestureRecord {
  /** Les 30 dernières tentatives au plus, de la plus ancienne à la plus récente. */
  attempts: Attempt[];
  lastSeenAt: number;
  /** Rang dans `REVIEW_DAYS` : avance quand la touche reste sûre un autre jour. */
  reviewStep: number;
}

/** Calculé, jamais stocké. */
export type KeyState = 'new' | 'learned' | 'sure' | 'automatic';

/** Clé = id de geste (`'e'`, `'é'`, `'^e'`, `'A'`…), voir `mapCharToGestureId`. */
export type Mastery = Record<string, GestureRecord>;
