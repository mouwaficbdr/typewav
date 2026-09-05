'use client';

/**
 * useProgressionCheck : hook exécuté après chaque session terminée.
 *
 * Responsabilités :
 * - Calcule le nouveau rang (médiane 10 dernières sessions)
 * - Détecte les jalons nouvellement débloqués
 * - Met à jour les records personnels
 * - Persiste les changements dans IndexedDB
 *
 * Spec : docs/specs/05-progression.md
 * Client Component justifié : accès IndexedDB.
 */

import { getSessions, mutatePersonalRecords, mutateUserProfile } from '@/lib/db';
import {
  calculateRank,
  checkMilestones,
  updatePersonalRecords,
} from '@/lib/progression';
import { useProgressionStore } from '@/stores/useProgressionStore';
import type { Milestone, SessionResult, UserProfile } from '@typewav/types';
import { useCallback } from 'react';

export function useProgressionCheck() {
  const { setRank, setProfile, setPersonalRecords, addPendingMilestones } =
    useProgressionStore();

  const runAfterSession = useCallback(
    async (session: SessionResult) => {
      const allSessions = await getSessions();
      const newRank = calculateRank(allSessions);

      // Profil : lecture et écriture sérialisées (mutateUserProfile) pour
      // qu'une fin de session concurrente ne fasse pas perdre un unlock.
      // `unlockedMilestones` est renseigné par le mutateur, qui s'exécute de
      // façon synchrone dans la transaction, donc disponible au retour.
      let unlockedMilestones: Milestone[] = [];
      const profile = await mutateUserProfile((current) => {
        const next = JSON.parse(JSON.stringify(current)) as UserProfile;
        next.currentRank = newRank;

        unlockedMilestones = checkMilestones(allSessions, next);
        for (const milestone of unlockedMilestones) {
          next.unlockedMilestoneIds.push(milestone.id);

          const { reward } = milestone;
          if (
            reward.type === 'theme' &&
            !next.unlockedThemes.includes(reward.themeId)
          ) {
            next.unlockedThemes.push(reward.themeId);
          } else if (
            reward.type === 'collection' &&
            !next.unlockedCollections.includes(reward.collectionId)
          ) {
            next.unlockedCollections.push(reward.collectionId);
          }
        }
        return next;
      });

      setRank(newRank);
      if (unlockedMilestones.length > 0) {
        addPendingMilestones(unlockedMilestones);
      }
      setProfile(profile);

      // Records personnels : même sérialisation.
      const updatedRecords = await mutatePersonalRecords((current) =>
        updatePersonalRecords(current, session),
      );
      setPersonalRecords(updatedRecords);
    },
    [setRank, setProfile, setPersonalRecords, addPendingMilestones],
  );

  return { runAfterSession };
}
