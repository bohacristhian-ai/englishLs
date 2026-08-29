import { createCardState } from './leitner';
import {
  ALL_LEVELS,
  HISTORY_LIMIT,
  SCHEMA_VERSION,
  boxCounts,
  consolidatedCount,
  emptyProgress,
  migrateProgress,
  rateWord,
  recordDay,
  recordStreak,
} from './progress';
import type { StreakState } from './progress';
import type { CardState } from './types';

const TODAY = '2026-08-15';
const AT = new Date(2026, 7, 15, 20, 0);

function card(overrides: Partial<CardState> & { wordId: string }): CardState {
  return { ...createCardState(overrides.wordId, TODAY), ...overrides };
}

describe('emptyProgress', () => {
  it('opens every level', () => {
    expect(emptyProgress().unlockedLevels).toEqual([...ALL_LEVELS]);
  });

  it('carries the schema version', () => {
    expect(emptyProgress().schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe('rateWord', () => {
  it('introduces a word that has never been seen', () => {
    const result = rateWord(emptyProgress(), 'l01-w001', 'sure', TODAY, AT);

    expect(result.cards['l01-w001']?.box).toBe(2);
    expect(result.cards['l01-w001']?.introducedOn).toBe(TODAY);
  });

  it('moves an existing card instead of replacing it', () => {
    const start = { ...emptyProgress(), cards: { 'l01-w001': card({ wordId: 'l01-w001', box: 3, totalCorrect: 5 }) } };
    const result = rateWord(start, 'l01-w001', 'sure', TODAY, AT);

    expect(result.cards['l01-w001']?.box).toBe(4);
    expect(result.cards['l01-w001']?.totalCorrect).toBe(6);
  });

  it('does not mutate the progress it is given', () => {
    const start = emptyProgress();
    rateWord(start, 'l01-w001', 'sure', TODAY, AT);

    expect(start.cards).toEqual({});
  });
});

describe('recordStreak', () => {
  const fresh: StreakState = { current: 0, longest: 0, lastSessionDay: null };

  it('starts at one on the first session', () => {
    expect(recordStreak(fresh, TODAY)).toEqual({
      current: 1,
      longest: 1,
      lastSessionDay: TODAY,
    });
  });

  it('extends on a consecutive day', () => {
    const after = recordStreak({ current: 3, longest: 5, lastSessionDay: '2026-08-14' }, TODAY);

    expect(after.current).toBe(4);
  });

  it('measures habit, not volume — a second session the same day changes nothing', () => {
    const state: StreakState = { current: 3, longest: 5, lastSessionDay: TODAY };

    expect(recordStreak(state, TODAY)).toBe(state);
  });

  it('resets after a missed day', () => {
    const after = recordStreak({ current: 9, longest: 9, lastSessionDay: '2026-08-12' }, TODAY);

    expect(after.current).toBe(1);
    expect(after.longest).toBe(9);
  });

  it('keeps the longest streak once beaten', () => {
    const after = recordStreak({ current: 5, longest: 5, lastSessionDay: '2026-08-14' }, TODAY);

    expect(after.longest).toBe(6);
  });
});

describe('recordDay', () => {
  it('adds a new day', () => {
    expect(recordDay([], TODAY, 20, 14)).toEqual([{ day: TODAY, reviewed: 20, correct: 14 }]);
  });

  it('merges a second session on the same day', () => {
    const history = recordDay([{ day: TODAY, reviewed: 20, correct: 14 }], TODAY, 10, 8);

    expect(history).toEqual([{ day: TODAY, reviewed: 30, correct: 22 }]);
  });

  it('caps the history so it cannot grow without bound', () => {
    let history = recordDay([], '2026-01-01', 1, 1);

    for (let index = 0; index < HISTORY_LIMIT + 20; index += 1) {
      history = recordDay(history, `2026-02-${String((index % 28) + 1).padStart(2, '0')}-x`, 1, 1);
    }

    expect(history.length).toBeLessThanOrEqual(HISTORY_LIMIT);
  });
});

describe('boxCounts', () => {
  it('counts cards per box', () => {
    const cards = {
      a: card({ wordId: 'a', box: 1 }),
      b: card({ wordId: 'b', box: 1 }),
      c: card({ wordId: 'c', box: 5 }),
    };

    expect(boxCounts(cards)).toEqual({ 1: 2, 2: 0, 3: 0, 4: 0, 5: 1 });
  });

  it('returns zeros for an empty progress', () => {
    expect(boxCounts({})).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });
});

describe('consolidatedCount', () => {
  it('counts only confirmed box-5 cards', () => {
    const cards = {
      a: card({ wordId: 'a', box: 5, consolidated: true }),
      b: card({ wordId: 'b', box: 5, consolidated: false }),
    };

    expect(consolidatedCount(cards)).toBe(1);
  });
});

describe('migrateProgress', () => {
  it('falls back to an empty state for unreadable storage', () => {
    expect(migrateProgress(null)).toEqual(emptyProgress());
    expect(migrateProgress('kaputt')).toEqual(emptyProgress());
  });

  it('keeps intact cards', () => {
    const stored = { cards: { a: card({ wordId: 'a', box: 3 }) } };

    expect(migrateProgress(stored).cards['a']?.box).toBe(3);
  });

  it('salvages the rest when one card is corrupt', () => {
    // Losing every word to a single broken entry would be the worse failure.
    const stored = {
      cards: {
        good: card({ wordId: 'good', box: 2 }),
        broken: { wordId: 'broken', box: 99 },
      },
    };

    const result = migrateProgress(stored);

    expect(result.cards['good']).toBeDefined();
    expect(result.cards['broken']).toBeUndefined();
  });

  it('drops a card whose key and wordId disagree', () => {
    const stored = { cards: { a: card({ wordId: 'somethingelse' }) } };

    expect(migrateProgress(stored).cards).toEqual({});
  });

  it('restores streak and history', () => {
    const stored = {
      cards: {},
      streak: { current: 4, longest: 9, lastSessionDay: TODAY },
      history: [{ day: TODAY, reviewed: 20, correct: 15 }],
    };

    const result = migrateProgress(stored);

    expect(result.streak.current).toBe(4);
    expect(result.history).toHaveLength(1);
  });

  it('repairs a missing streak instead of failing', () => {
    expect(migrateProgress({ cards: {} }).streak).toEqual(emptyProgress().streak);
  });

  it('always writes the current schema version', () => {
    expect(migrateProgress({ schemaVersion: 0, cards: {} }).schemaVersion).toBe(SCHEMA_VERSION);
  });
});
