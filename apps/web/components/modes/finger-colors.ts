import type { FingerId } from '@typewav/types';

/**
 * Couleur d'accent par doigt de frappe, partagée par les schémas clavier du
 * mode Apprentissage (`KeyboardDiagram` QWERTY, `KeyboardDiagramAzerty`). Une
 * seule source pour que les deux diagrammes teintent un doigt de la même
 * couleur.
 */
export const FINGER_COLORS: Record<FingerId, string> = {
  LP: '#FF6B6B', // Auriculaire gauche
  LR: '#FF9F43', // Annulaire gauche
  LM: '#FECA57', // Majeur gauche
  LI: '#48DBFB', // Index gauche
  LT: '#A29BFE', // Pouce gauche
  RT: '#A29BFE', // Pouce droit
  RI: '#00D4AA', // Index droit
  RM: '#1DD1A1', // Majeur droit
  RR: '#54A0FF', // Annulaire droit
  RP: '#C44569', // Auriculaire droit
};
