import { daysBetween } from './dates';
import { createCardState, review } from './leitner';
import type { Box, CardState, IsoDate, Rating } from './types';

/**
 * The learner's progress as a value, plus the pure transitions on it.
 *
 * Deliberately separate from the store: this is what gets written to the
 * user's device and can never be recovered if it breaks, so it lives in the
 * domain layer where it is testable without a browser.
 */

export const SCHEMA_VERSION = 1;

/** Days of history kept. The stats screen shows 14; the rest is headroom. */
export const HISTORY_LIMIT = 90;

export const ALL_LEVELS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export interface DaySummary {
  day: IsoDate;
  reviewed: number;
  correct: number;
}

export interface StreakState {
  current: number;
  longest: number;
  lastSessionDay: IsoDate | null;
}

export interface ProgressState {
  schemaVersion: number;
  cards: Record<string, CardState>;
  unlockedLevels: number[];
  streak: StreakState;
  history: DaySummary[];
}

export function emptyProgress(): ProgressState {
  return {
    schemaVersion: SCHEMA_VERSION,
    cards: {},
    unlockedLevels: [...ALL_LEVELS],
    streak: { current: 0, longest: 0, lastSessionDay: null },
    history: [],
  };
}

/** Applies one rating, introducing the word if it has never been seen. */
export function rateWord(
  progress: ProgressState,
  wordId: string,
  rating: Rating,
  today: IsoDate,
  reviewedAt: Date,
): ProgressState {
  const existing = progress.cards[wordId] ?? createCardState(wordId, today);

  return {
    ...progress,
    cards: { ...progress.cards, [wordId]: review(existing, rating, today, reviewedAt) },
  };
}

/**
 * Extends the streak for a day on which the learner studied.
 *
 * Only consecutive days count. Studying twice on one day changes nothing —
 * the streak measures habit, not volume.
 */
export function recordStreak(streak: StreakState, day: IsoDate): StreakState {
  if (streak.lastSessionDay === day) return streak;

  const current =
    streak.lastSessionDay !== null && daysBetween(streak.lastSessionDay, day) === 1
      ? streak.current + 1
      : 1;

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastSessionDay: day,
  };
}

/** Adds a day to the history, merging a second session on the same day. */
export function recordDay(
  history: readonly DaySummary[],
  day: IsoDate,
  reviewed: number,
  correct: number,
): DaySummary[] {
  const index = history.findIndex((entry) => entry.day === day);

  if (index >= 0) {
    const existing = history[index]!;
    const merged = [...history];
    merged[index] = {
      day,
      reviewed: existing.reviewed + reviewed,
      correct: existing.correct + correct,
    };

    return merged;
  }

  return [...history, { day, reviewed, correct }].slice(-HISTORY_LIMIT);
}

export function boxCounts(cards: Readonly<Record<string, CardState>>): Record<Box, number> {
  const counts: Record<Box, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const card of Object.values(cards)) counts[card.box] += 1;

  return counts;
}

export function consolidatedCount(cards: Readonly<Record<string, CardState>>): number {
  return Object.values(cards).filter((card) => card.consolidated).length;
}

function isBox(value: unknown): value is Box {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isValidCard(value: unknown, wordId: string): value is CardState {
  if (typeof value !== 'object' || value === null) return false;

  const card = value as Record<string, unknown>;

  return (
    card['wordId'] === wordId &&
    isBox(card['box']) &&
    typeof card['dueOn'] === 'string' &&
    typeof card['introducedOn'] === 'string' &&
    typeof card['correctStreak'] === 'number' &&
    typeof card['totalCorrect'] === 'number' &&
    typeof card['totalWrong'] === 'number' &&
    typeof card['consolidated'] === 'boolean'
  );
}

/**
 * Turns whatever was in storage back into a usable ProgressState.
 *
 * Salvages rather than discards: a single corrupt card entry must not cost the
 * learner every other word. Only what cannot be repaired is dropped, and a
 * completely unreadable payload falls back to an empty state instead of
 * crashing the app on start.
 */
export function migrateProgress(raw: unknown): ProgressState {
  const fallback = emptyProgress();

  if (typeof raw !== 'object' || raw === null) return fallback;

  const stored = raw as Record<string, unknown>;
  const cards: Record<string, CardState> = {};
  const storedCards = stored['cards'];

  if (typeof storedCards === 'object' && storedCards !== null) {
    for (const [wordId, card] of Object.entries(storedCards)) {
      if (isValidCard(card, wordId)) cards[wordId] = card;
    }
  }

  const streak = stored['streak'];
  const history = stored['history'];

  return {
    schemaVersion: SCHEMA_VERSION,
    cards,
    unlockedLevels: Array.isArray(stored['unlockedLevels'])
      ? (stored['unlockedLevels'] as unknown[]).filter(
          (level): level is number => typeof level === 'number',
        )
      : [...ALL_LEVELS],
    streak:
      typeof streak === 'object' && streak !== null
        ? {
            current: numberOr((streak as Record<string, unknown>)['current'], 0),
            longest: numberOr((streak as Record<string, unknown>)['longest'], 0),
            lastSessionDay:
              typeof (streak as Record<string, unknown>)['lastSessionDay'] === 'string'
                ? ((streak as Record<string, unknown>)['lastSessionDay'] as string)
                : null,
          }
        : fallback.streak,
    history: Array.isArray(history)
      ? history
          .filter(
            (entry): entry is DaySummary =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as DaySummary).day === 'string',
          )
          .slice(-HISTORY_LIMIT)
      : [],
  };
}

export interface ExportPayload {
  app: 'englishLs';
  schemaVersion: number;
  exportedAt: string;
  progress: ProgressState;
}

/**
 * Serialises the progress for a file the learner keeps.
 *
 * The only insurance against losing everything: browser storage can be cleared
 * by the user, by the browser under pressure, or — on iOS — by the system.
 */
export function exportProgress(progress: ProgressState, now: Date): string {
  const payload: ExportPayload = {
    app: 'englishLs',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    progress,
  };

  return JSON.stringify(payload, null, 2);
}

export class ImportError extends Error {}

/**
 * Reads an exported file back.
 *
 * Strict about the envelope and forgiving about the contents: a wrong file
 * must be rejected loudly, but a slightly damaged export should still restore
 * whatever is intact rather than nothing at all.
 */
export function parseImport(json: string): ProgressState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ImportError('Die Datei ist kein gültiges JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ImportError('Die Datei enthält keine Sicherung.');
  }

  const payload = parsed as Record<string, unknown>;

  if (payload['app'] !== 'englishLs') {
    throw new ImportError('Diese Datei stammt nicht aus englishLs.');
  }

  if (typeof payload['progress'] !== 'object' || payload['progress'] === null) {
    throw new ImportError('In der Datei fehlt der Fortschritt.');
  }

  return migrateProgress(payload['progress']);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
