/**
 * rank-sound.ts : comment le rang de progression enrichit le SON, piano seul.
 *
 * Le rang (RANKS, @typewav/types) pilote déjà la couleur de l'aura ambiante.
 * Ici il façonne l'instrument lui-même : plus on grimpe, plus le piano gagne
 * de l'espace (réverbe), de la nuance (plancher de vélocité plus bas, donc
 * vrais pianissimo) et du liant (release plus long). Aucune note nouvelle,
 * aucune voix ajoutée (pas de retour du bourdon) : le même fichier MIDI sonne
 * simplement plus « joué » à mesure que l'utilisateur progresse.
 *
 * Fonctions pures, sans dépendance Tone.js : consommées par
 * hooks/useAudioEngine.ts à la construction du graphe audio. Le rang est
 * stable pour toute la durée d'une session (il n'est recalculé qu'après coup,
 * sur l'écran de résultats), donc lu une seule fois par graphe.
 */

import type { RankTier } from '@typewav/types';

export interface RankSoundProfile {
  /** Mix wet de la réverbe (0-1). Croît avec le rang. */
  reverbWet: number;
  /** Décroissance de la réverbe, en secondes. Croît avec le rang. */
  reverbDecaySec: number;
  /**
   * Plancher de vélocité (0-1) appliqué à chaque note. Décroît avec le rang :
   * au sommet, les notes douces du morceau redeviennent réellement douces et
   * l'écart entre piano et forte se rouvre.
   */
  velocityFloor: number;
  /** Release des voix, en secondes. Croît avec le rang (jeu plus lié). */
  releaseSec: number;
}

/**
 * Paliers, du plus bas au plus haut. `novice` est calé sur le réglage piano
 * actuel (PACK_CONFIGS.piano dans useAudioEngine : wet 0.25, decay 0.30,
 * plancher 0.20, release sampler 1.8) : un tout nouvel utilisateur n'entend
 * aucune régression, seulement le point de départ de la montée. Les écarts
 * entre rangs voisins sont choisis pour rester perceptibles sur un
 * haut-parleur de portable (wet +0.06, decay +0.5s environ), pas seulement au
 * casque.
 */
const RANK_SOUND_PROFILES: Record<RankTier, RankSoundProfile> = {
  novice: {
    reverbWet: 0.25,
    reverbDecaySec: 0.3,
    velocityFloor: 0.2,
    releaseSec: 1.8,
  },
  apprentice: {
    reverbWet: 0.31,
    reverbDecaySec: 0.8,
    velocityFloor: 0.17,
    releaseSec: 1.95,
  },
  operator: {
    reverbWet: 0.37,
    reverbDecaySec: 1.35,
    velocityFloor: 0.145,
    releaseSec: 2.15,
  },
  architect: {
    reverbWet: 0.43,
    reverbDecaySec: 1.95,
    velocityFloor: 0.12,
    releaseSec: 2.35,
  },
  ghost: {
    reverbWet: 0.49,
    reverbDecaySec: 2.55,
    velocityFloor: 0.1,
    releaseSec: 2.55,
  },
};

export function getRankSoundProfile(rank: RankTier): RankSoundProfile {
  return RANK_SOUND_PROFILES[rank];
}

/**
 * Vélocité MIDI brute (0-127) vers gain de déclenchement (0-1), bornée en bas
 * par `floor` (voir RankSoundProfile.velocityFloor) et en haut par 1. Une
 * entrée non finie retombe sur une vélocité médiane, elle aussi bornée par le
 * plancher. Remplace l'ancien normalizeVelocity : résultat identique à
 * floor = 0.2.
 */
export function clampVelocity(rawMidiVelocity: number, floor: number): number {
  if (!Number.isFinite(rawMidiVelocity)) return Math.max(floor, 0.75);
  return Math.max(floor, Math.min(1, rawMidiVelocity / 127));
}
