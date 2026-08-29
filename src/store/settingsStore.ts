import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_DAY_START_HOUR } from '../domain/dates';
import { DEFAULT_SESSION_SIZE } from '../domain/scheduler';
import type { Direction } from '../domain/types';
import type { Accent } from '../speech/tts';

export const SETTINGS_KEY = 'englishls.settings';

export interface Settings {
  accent: Accent;
  /** Speak the word on card change, unlocked by the tap on "Session starten". */
  autoplay: boolean;
  direction: Direction;
  sessionSize: number;
  level: number;
  /** Local hour a learning day begins. 04:00 keeps a late session in one day. */
  dayStartHour: number;
}

interface SettingsActions {
  update: (patch: Partial<Settings>) => void;
}

export const DEFAULT_SETTINGS: Settings = {
  accent: 'gb',
  autoplay: true,
  direction: 'de-en',
  sessionSize: DEFAULT_SESSION_SIZE,
  level: 1,
  dayStartHour: DEFAULT_DAY_START_HOUR,
};

export const useSettingsStore = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => localStorage),
      // Unknown or missing settings fall back to the defaults rather than
      // leaving the app in a half-configured state.
      merge: (persisted, current) => ({
        ...current,
        ...DEFAULT_SETTINGS,
        ...(typeof persisted === 'object' && persisted !== null ? persisted : {}),
      }),
    },
  ),
);
