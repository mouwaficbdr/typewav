'use client';

/**
 * useProgressionCheck : hook exécuté après chaque session terminée.
 *
 * Responsabilités :
 * - Calcule le nouveau rang (médiane 10 dernières sessions)
 * - Met à jour les records personnels
 * - Persiste les changements dans IndexedDB
 *
 * Spec : docs/specs/05-progression.md
 * Client Component justifié : accès IndexedDB.
 */

import { getSessions, mutatePersonalRecords, mutateUserProfile } from '@/lib/db';
import { calculateRank, updatePersonalRecords } from '@/lib/progression';
import { useProgressionStore } from '@/stores/useProgressionStore';
import type { SessionResult } from '@typewav/types';
import { useCallback } from 'react';

export function useProgressionCheck() {
  const { setRank, setProfile, setPersonalRecords } = useProgressionStore();

  const runAfterSession = useCallback(
    async (session: SessionResult) => {
      const allSessions = await getSessions();
      const newRank = calculateRank(allSessions);

      // Lecture + écriture sérialisées (mutateUserProfile) : deux fins de
      // session rapprochées (le mode Apprentissage relance une série tout
      // de suite) ne se marchent pas dessus sur le rang.
      const profile = await mutateUserProfile((current) => ({
        ...current,
        currentRank: newRank,
      }));

      setRank(newRank);
      setProfile(profile);

      // Records personnels : même sérialisation.
      const updatedRecords = await mutatePersonalRecords((current) =>
        updatePersonalRecords(current, session),
      );
      setPersonalRecords(updatedRecords);
    },
    [setRank, setProfile, setPersonalRecords],
  );

  return { runAfterSession };
}
