'use client';

/**
 * useProgressionCheck — hook exécuté après chaque session terminée.
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

import {
  getPersonalRecords,
  getSessions,
  getUserProfile,
  savePersonalRecords,
  saveUserProfile,
} from '@/lib/db';
import {
  calculateRank,
  checkMilestones,
  updatePersonalRecords,
} from '@/lib/progression';
import { useProgressionStore } from '@/stores/useProgressionStore';
import type { SessionResult } from '@typewav/types';
import { useCallback } from 'react';

export function useProgressionCheck() {
  const { setRank, setProfile, setPersonalRecords, addPendingMilestones } =
    useProgressionStore();

  const runAfterSession = useCallback(
    async (session: SessionResult) => {
      const [allSessions, profile, records] = await Promise.all([
        getSessions(),
        getUserProfile(),
        getPersonalRecords(),
      ]);

      // Rang
      const newRank = calculateRank(allSessions);
      if (newRank !== profile.currentRank) {
        profile.currentRank = newRank;
      }
      setRank(newRank);

      // Jalons
      const newMilestones = checkMilestones(allSessions, profile);
      if (newMilestones.length > 0) {
        for (const milestone of newMilestones) {
          profile.unlockedMilestoneIds.push(milestone.id);

          // Appliquer les récompenses au profil
          const { reward } = milestone;
          if (
            reward.type === 'theme' &&
            !profile.unlockedThemes.includes(reward.themeId)
          ) {
            profile.unlockedThemes.push(reward.themeId);
          } else if (
            reward.type === 'soundpack' &&
            !profile.unlockedSoundPacks.includes(reward.packId)
          ) {
            profile.unlockedSoundPacks.push(reward.packId);
          } else if (
            reward.type === 'collection' &&
            !profile.unlockedCollections.includes(reward.collectionId)
          ) {
            profile.unlockedCollections.push(reward.collectionId);
          }
        }
        addPendingMilestones(newMilestones);
      }

      // Sauvegarder profil mis à jour
      await saveUserProfile(profile);
      setProfile(profile);

      // Records personnels
      const updatedRecords = updatePersonalRecords(records, session);
      await savePersonalRecords(updatedRecords);
      setPersonalRecords(updatedRecords);
    },
    [setRank, setProfile, setPersonalRecords, addPendingMilestones],
  );

  return { runAfterSession };
}
