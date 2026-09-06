'use client';

/**
 * useProgressionStore : rang et records personnels.
 * Client Component justifié : accès IndexedDB, état UI réactif.
 * Spec : docs/specs/05-progression.md
 */

import type { PersonalRecords, RankTier, UserProfile } from '@typewav/types';
import { create } from 'zustand';

interface ProgressionState {
  rank: RankTier;
  profile: UserProfile | null;
  personalRecords: PersonalRecords | null;

  setRank: (rank: RankTier) => void;
  setProfile: (profile: UserProfile) => void;
  setPersonalRecords: (records: PersonalRecords) => void;
}

export const useProgressionStore = create<ProgressionState>((set) => ({
  rank: 'novice',
  profile: null,
  personalRecords: null,

  setRank: (rank) => set({ rank }),
  setProfile: (profile) => set({ profile }),
  setPersonalRecords: (personalRecords) => set({ personalRecords }),
}));
