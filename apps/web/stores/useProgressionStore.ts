'use client';

/**
 * useProgressionStore : rangs, jalons et records personnels.
 * Client Component justifié : accès IndexedDB, état UI réactif.
 * Spec : docs/specs/05-progression.md
 */

import type {
  Milestone,
  PersonalRecords,
  RankTier,
  UserProfile,
} from '@typewav/types';
import { create } from 'zustand';

interface ProgressionState {
  rank: RankTier;
  profile: UserProfile | null;
  personalRecords: PersonalRecords | null;
  /** Jalons récemment débloqués (à afficher en toast) */
  pendingMilestones: Milestone[];

  setRank: (rank: RankTier) => void;
  setProfile: (profile: UserProfile) => void;
  setPersonalRecords: (records: PersonalRecords) => void;
  addPendingMilestones: (milestones: Milestone[]) => void;
  clearPendingMilestones: () => void;
}

export const useProgressionStore = create<ProgressionState>((set) => ({
  rank: 'novice',
  profile: null,
  personalRecords: null,
  pendingMilestones: [],

  setRank: (rank) => set({ rank }),
  setProfile: (profile) => set({ profile }),
  setPersonalRecords: (personalRecords) => set({ personalRecords }),
  addPendingMilestones: (milestones) =>
    set((state) => ({
      pendingMilestones: [...state.pendingMilestones, ...milestones],
    })),
  clearPendingMilestones: () => set({ pendingMilestones: [] }),
}));
