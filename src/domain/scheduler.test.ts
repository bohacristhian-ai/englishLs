import { createCardState } from './leitner';
import {
  DEFAULT_MAX_NEW_PER_DAY,
  DEFAULT_SESSION_SIZE,
  MAX_REPEATS_PER_CARD,
  countAvailableNew,
  countDue,
  countIntroducedOn,
  nextDueDay,
  currentCard,
  isSessionFinished,
  planSession,
  recordAnswer,
  startSession,
} from './scheduler';
import type { Box, CardState, IsoDate, Word } from './types';

const TODAY = '2026-08-15';

function word(id: string): Word {
  return {
    id,
    level: 1,
    term: id,
    pos: 'noun',
    ipaGb: 'ˈtest',
    syllables: ['test'],
    stressIndex: 0,
    translation: 'Test',
    example: 'A test.',
    exampleDe: 'Ein Test.',
  };
}

function words(count: number): Word[] {
  return Array.from({ length: count }, (_, index) =>
    word(`l01-w${String(index + 1).padStart(3, '0')}`),
  );
}

function seen(
  wordId: string,
  overrides: Partial<CardState> & { box?: Box; dueOn?: IsoDate } = {},
): CardState {
  return { ...createCardState(wordId, '2026-08-01'), ...overrides };
}

function progress(...states: CardState[]): Record<string, CardState> {
  return Object.fromEntries(states.map((state) => [state.wordId, state]));
}

describe('planSession defaults', () => {
  it('matches the numbers fixed in the plan', () => {
    expect(DEFAULT_SESSION_SIZE).toBe(20);
    expect(DEFAULT_MAX_NEW_PER_DAY).toBe(10);
    expect(MAX_REPEATS_PER_CARD).toBe(2);
  });
});

describe('planSession', () => {
  it('introduces new words when there is no progress yet', () => {
    const plan = planSession(words(50), {}, TODAY);

    expect(plan).toHaveLength(DEFAULT_MAX_NEW_PER_DAY);
    expect(plan[0]).toBe('l01-w001');
  });

  it('never exceeds the daily budget for new words', () => {
    const plan = planSession(words(50), {}, TODAY, { targetCards: 20, maxNewPerDay: 3 });

    expect(plan).toHaveLength(3);
  });

  it('counts new words already introduced earlier the same day', () => {
    const cards = progress(
      createCardState('l01-w001', TODAY),
      createCardState('l01-w002', TODAY),
    );

    // Two of today's ten are spent; the two seen cards are also due today.
    const plan = planSession(words(50), cards, TODAY, { maxNewPerDay: 10 });

    expect(plan.filter((id) => !(id in cards))).toHaveLength(8);
  });

  it('leaves the budget intact for words introduced on an earlier day', () => {
    const cards = progress(seen('l01-w001', { introducedOn: '2026-08-14', dueOn: '2026-08-20' }));

    const plan = planSession(words(50), cards, TODAY);

    expect(plan.filter((id) => !(id in cards))).toHaveLength(10);
  });

  it('skips cards that are not due yet', () => {
    const cards = progress(
      seen('l01-w001', { dueOn: '2026-08-20' }),
      seen('l01-w002', { dueOn: TODAY }),
    );

    const plan = planSession(words(2), cards, TODAY);

    expect(plan).toEqual(['l01-w002']);
  });

  it('includes overdue cards', () => {
    const cards = progress(seen('l01-w001', { dueOn: '2026-08-01' }));

    expect(planSession(words(1), cards, TODAY)).toEqual(['l01-w001']);
  });

  it('puts due cards before new words', () => {
    const cards = progress(seen('l01-w030', { dueOn: TODAY }));

    const plan = planSession(words(50), cards, TODAY, { targetCards: 5 });

    expect(plan[0]).toBe('l01-w030');
    expect(plan).toHaveLength(5);
  });

  it('sorts due cards by box, lowest first', () => {
    const cards = progress(
      seen('l01-w001', { box: 5, dueOn: TODAY }),
      seen('l01-w002', { box: 1, dueOn: TODAY }),
      seen('l01-w003', { box: 3, dueOn: TODAY }),
    );

    expect(planSession(words(3), cards, TODAY)).toEqual([
      'l01-w002',
      'l01-w003',
      'l01-w001',
    ]);
  });

  it('sorts equal boxes by longest overdue first', () => {
    const cards = progress(
      seen('l01-w001', { box: 2, dueOn: '2026-08-14' }),
      seen('l01-w002', { box: 2, dueOn: '2026-08-10' }),
      seen('l01-w003', { box: 2, dueOn: TODAY }),
    );

    expect(planSession(words(3), cards, TODAY)).toEqual([
      'l01-w002',
      'l01-w001',
      'l01-w003',
    ]);
  });

  it('caps the session at the target, due cards included', () => {
    const cards = progress(
      ...words(30).map((entry) => seen(entry.id, { box: 2, dueOn: TODAY })),
    );

    expect(planSession(words(30), cards, TODAY, { targetCards: 20 })).toHaveLength(20);
  });

  it('returns nothing when all cards are scheduled ahead and no words are left', () => {
    const cards = progress(
      ...words(5).map((entry) => seen(entry.id, { dueOn: '2026-09-01' })),
    );

    expect(planSession(words(5), cards, TODAY)).toEqual([]);
  });
});

describe('countIntroducedOn', () => {
  it('counts only the given day', () => {
    const cards = progress(
      createCardState('l01-w001', TODAY),
      createCardState('l01-w002', TODAY),
      createCardState('l01-w003', '2026-08-14'),
    );

    expect(countIntroducedOn(cards, TODAY)).toBe(2);
  });
});

describe('countDue', () => {
  it('counts only cards whose day has arrived', () => {
    const cards = progress(
      seen('l01-w001', { dueOn: TODAY }),
      seen('l01-w002', { dueOn: '2026-08-10' }),
      seen('l01-w003', { dueOn: '2026-09-01' }),
    );

    expect(countDue(words(3), cards, TODAY)).toBe(2);
  });

  it('does not count words that were never introduced', () => {
    expect(countDue(words(50), {}, TODAY)).toBe(0);
  });
});

describe('countAvailableNew', () => {
  it('is capped by the daily budget, not by the level size', () => {
    expect(countAvailableNew(words(50), {}, TODAY, 10)).toBe(10);
  });

  it('shrinks as new words are introduced during the day', () => {
    const cards = progress(createCardState('l01-w001', TODAY));

    expect(countAvailableNew(words(50), cards, TODAY, 10)).toBe(9);
  });

  it('is zero once every word has been seen', () => {
    const cards = progress(...words(5).map((entry) => seen(entry.id)));

    expect(countAvailableNew(words(5), cards, TODAY, 10)).toBe(0);
  });
});

describe('nextDueDay', () => {
  it('finds the earliest future due day', () => {
    const cards = progress(
      seen('l01-w001', { dueOn: '2026-09-01' }),
      seen('l01-w002', { dueOn: '2026-08-20' }),
    );

    expect(nextDueDay(cards, TODAY)).toBe('2026-08-20');
  });

  it('ignores cards that are already due', () => {
    const cards = progress(
      seen('l01-w001', { dueOn: TODAY }),
      seen('l01-w002', { dueOn: '2026-08-20' }),
    );

    expect(nextDueDay(cards, TODAY)).toBe('2026-08-20');
  });

  it('returns null when nothing is scheduled ahead', () => {
    expect(nextDueDay(progress(seen('l01-w001', { dueOn: TODAY })), TODAY)).toBeNull();
    expect(nextDueDay({}, TODAY)).toBeNull();
  });
});

describe('session queue', () => {
  it('presents cards in the planned order', () => {
    let state = startSession(['a', 'b', 'c'], 20);

    expect(currentCard(state)).toBe('a');

    state = recordAnswer(state, false);
    expect(currentCard(state)).toBe('b');

    state = recordAnswer(state, false);
    expect(currentCard(state)).toBe('c');
  });

  it('finishes once the queue runs dry', () => {
    let state = startSession(['a'], 20);

    state = recordAnswer(state, false);

    expect(isSessionFinished(state)).toBe(true);
    expect(currentCard(state)).toBeNull();
  });

  it('re-queues a card that landed in the drill box', () => {
    let state = startSession(['a', 'b'], 20);

    state = recordAnswer(state, true);

    expect(state.queue).toEqual(['b', 'a']);
  });

  it('counts repetitions towards the session target', () => {
    let state = startSession(['a', 'b'], 20);

    state = recordAnswer(state, true);
    state = recordAnswer(state, false);

    expect(state.presented).toBe(2);
    expect(state.queue).toEqual(['a']);
  });

  it('repeats a card at most twice, so the session terminates', () => {
    let state = startSession(['a'], 20);

    // Always failed — without the cap this would loop forever.
    for (let guard = 0; guard < 10 && !isSessionFinished(state); guard += 1) {
      state = recordAnswer(state, true);
    }

    expect(isSessionFinished(state)).toBe(true);
    expect(state.presented).toBe(MAX_REPEATS_PER_CARD + 1);
    expect(state.repeats['a']).toBe(MAX_REPEATS_PER_CARD);
  });

  it('stops at the target even when cards keep failing', () => {
    let state = startSession(['a', 'b', 'c'], 4);

    for (let guard = 0; guard < 20 && !isSessionFinished(state); guard += 1) {
      state = recordAnswer(state, true);
    }

    expect(state.presented).toBe(4);
    expect(isSessionFinished(state)).toBe(true);
  });

  it('does not re-queue on the last allowed presentation', () => {
    let state = startSession(['a', 'b'], 2);

    state = recordAnswer(state, true);
    state = recordAnswer(state, true);

    expect(isSessionFinished(state)).toBe(true);
  });

  it('ignores an answer when there is no card left', () => {
    const empty = startSession([], 20);

    expect(recordAnswer(empty, true)).toEqual(empty);
  });

  it('tracks repeats per card, not globally', () => {
    let state = startSession(['a', 'b'], 20);

    state = recordAnswer(state, true); // a → back of queue
    state = recordAnswer(state, true); // b → back of queue

    expect(state.repeats).toEqual({ a: 1, b: 1 });
  });
});
