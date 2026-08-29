import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  SCHEMA_VERSION,
  emptyProgress,
  migrateProgress,
  rateWord,
  recordDay,
  recordStreak,
} from '../domain/progress';
import type { ProgressState } from '../domain/progress';
import type { IsoDate, Rating } from '../domain/types';

/**
 * The learner's progress, persisted to localStorage.
 *
 * The store holds state and delegates every transition to the pure functions
 * in `domain/progress` — this file stays thin on purpose, because the logic
 * that touches the user's only copy of their progress belongs where it can be
 * tested without a browser.
 */

export const STORAGE_KEY = 'englishls.progress';

interface ProgressActions {
  rate: (wordId: string, rating: Rating, today: IsoDate, reviewedAt: Date) => void;
  reset: () => void;
}

export type ProgressStore = ProgressState & ProgressActions;

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      ...emptyProgress(),

      /**
       * One rating also marks the day as studied.
       *
       * Counting the day only when a session *finishes* would erase the streak
       * and the day's history for anyone who stops after fifteen of twenty
       * cards — punishing the learner who studied but did not complete. Both
       * transitions are idempotent per day, so calling them per rating is safe.
       */
      rate: (wordId, rating, today, reviewedAt) =>
        set((state) => ({
          ...rateWord(state, wordId, rating, today, reviewedAt),
          streak: recordStreak(state.streak, today),
          history: recordDay(state.history, today, 1, rating === 'sure' ? 1 : 0),
        })),

      reset: () => set(emptyProgress()),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
      // Runs for any stored payload, not only on a version bump — storage can
      // also be truncated or hand-edited, and salvaging beats crashing.
      migrate: (persisted) => migrateProgress(persisted) as ProgressStore,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        cards: state.cards,
        unlockedLevels: state.unlockedLevels,
        streak: state.streak,
        history: state.history,
      }),
    },
  ),
);
