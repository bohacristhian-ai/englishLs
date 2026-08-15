import {
  BOX_INTERVAL_DAYS,
  CONSOLIDATED_INTERVAL_DAYS,
  createCardState,
  intervalDaysFor,
  landsInDrillBox,
  nextBox,
  review,
} from './leitner';
import type { Box, CardState, Rating } from './types';

const TODAY = '2026-08-15';
const REVIEWED_AT = new Date(2026, 7, 15, 20, 30);

const BOXES: Box[] = [1, 2, 3, 4, 5];

function card(overrides: Partial<CardState> = {}): CardState {
  return { ...createCardState('l01-w001', TODAY), ...overrides };
}

describe('BOX_INTERVAL_DAYS', () => {
  it('matches the intervals fixed in the plan', () => {
    expect(BOX_INTERVAL_DAYS).toEqual({ 1: 0, 2: 1, 3: 3, 4: 7, 5: 16 });
    expect(CONSOLIDATED_INTERVAL_DAYS).toBe(30);
  });
});

describe('nextBox', () => {
  it('sends "again" back to box 1 from anywhere', () => {
    for (const box of BOXES) {
      expect(nextBox(box, 'again')).toBe(1);
    }
  });

  it('steps "unsure" down one box', () => {
    expect(nextBox(5, 'unsure')).toBe(4);
    expect(nextBox(4, 'unsure')).toBe(3);
    expect(nextBox(2, 'unsure')).toBe(1);
  });

  it('does not step "unsure" below box 1', () => {
    expect(nextBox(1, 'unsure')).toBe(1);
  });

  it('steps "sure" up one box', () => {
    expect(nextBox(1, 'sure')).toBe(2);
    expect(nextBox(4, 'sure')).toBe(5);
  });

  it('does not step "sure" above box 5', () => {
    expect(nextBox(5, 'sure')).toBe(5);
  });
});

describe('intervalDaysFor', () => {
  it('derives the interval from the new box', () => {
    expect(intervalDaysFor(1, 'sure')).toBe(1); // → box 2
    expect(intervalDaysFor(2, 'sure')).toBe(3); // → box 3
    expect(intervalDaysFor(3, 'sure')).toBe(7); // → box 4
    expect(intervalDaysFor(4, 'sure')).toBe(16); // → box 5
  });

  it('brings "again" back the same day, from every box', () => {
    for (const box of BOXES) {
      expect(intervalDaysFor(box, 'again')).toBe(0);
    }
  });

  it('applies the lowered box for "unsure"', () => {
    expect(intervalDaysFor(5, 'unsure')).toBe(7); // → box 4
    expect(intervalDaysFor(3, 'unsure')).toBe(1); // → box 2
    expect(intervalDaysFor(1, 'unsure')).toBe(0); // stays box 1
  });

  it('consolidates a card confirmed in box 5', () => {
    expect(intervalDaysFor(5, 'sure')).toBe(30);
  });

  it('has exactly one exception to "interval follows the new box"', () => {
    const exceptions: string[] = [];

    for (const box of BOXES) {
      for (const rating of ['again', 'unsure', 'sure'] satisfies Rating[]) {
        if (intervalDaysFor(box, rating) !== BOX_INTERVAL_DAYS[nextBox(box, rating)]) {
          exceptions.push(`${box}/${rating}`);
        }
      }
    }

    expect(exceptions).toEqual(['5/sure']);
  });
});

describe('createCardState', () => {
  it('introduces a word in box 1, due immediately', () => {
    expect(createCardState('l01-w007', TODAY)).toEqual({
      wordId: 'l01-w007',
      box: 1,
      dueOn: TODAY,
      introducedOn: TODAY,
      lastReviewedAt: null,
      correctStreak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      consolidated: false,
    });
  });
});

describe('review', () => {
  it('does not mutate the card it is given', () => {
    const original = card({ box: 3 });
    const snapshot = { ...original };

    review(original, 'sure', TODAY, REVIEWED_AT);

    expect(original).toEqual(snapshot);
  });

  it('moves the box and sets the due date from it', () => {
    const result = review(card({ box: 2 }), 'sure', TODAY, REVIEWED_AT);

    expect(result.box).toBe(3);
    expect(result.dueOn).toBe('2026-08-18'); // today + 3
  });

  it('drops "again" to box 1 and back into today', () => {
    const result = review(card({ box: 4, correctStreak: 6 }), 'again', TODAY, REVIEWED_AT);

    expect(result.box).toBe(1);
    expect(result.dueOn).toBe(TODAY);
    expect(result.correctStreak).toBe(0);
    expect(result.totalWrong).toBe(1);
  });

  it('keeps the streak on "unsure" — the box already carries the penalty', () => {
    const result = review(card({ box: 4, correctStreak: 3 }), 'unsure', TODAY, REVIEWED_AT);

    expect(result.box).toBe(3);
    expect(result.correctStreak).toBe(3);
    expect(result.totalCorrect).toBe(0);
    expect(result.totalWrong).toBe(0);
  });

  it('counts a streak of "sure" ratings', () => {
    let state = card();

    state = review(state, 'sure', TODAY, REVIEWED_AT);
    state = review(state, 'sure', TODAY, REVIEWED_AT);

    expect(state.correctStreak).toBe(2);
    expect(state.totalCorrect).toBe(2);
  });

  it('records the review timestamp', () => {
    const result = review(card(), 'sure', TODAY, REVIEWED_AT);

    expect(result.lastReviewedAt).toBe(REVIEWED_AT.toISOString());
  });

  it('marks a card consolidated once confirmed in box 5', () => {
    const arrived = review(card({ box: 4 }), 'sure', TODAY, REVIEWED_AT);

    expect(arrived.box).toBe(5);
    expect(arrived.consolidated).toBe(false);
    expect(arrived.dueOn).toBe('2026-08-31'); // today + 16

    const confirmed = review(arrived, 'sure', TODAY, REVIEWED_AT);

    expect(confirmed.box).toBe(5);
    expect(confirmed.consolidated).toBe(true);
    expect(confirmed.dueOn).toBe('2026-09-14'); // today + 30
  });

  it('clears consolidation when the card falls out of box 5', () => {
    const consolidated = card({ box: 5, consolidated: true });

    expect(review(consolidated, 'unsure', TODAY, REVIEWED_AT).consolidated).toBe(false);
    expect(review(consolidated, 'again', TODAY, REVIEWED_AT).consolidated).toBe(false);
  });

  it('does not let "unsure" throw a box-5 card out of its long rhythm', () => {
    // Revision 1 sent it back to "tomorrow"; that swing is what the review fixed.
    const result = review(card({ box: 5 }), 'unsure', TODAY, REVIEWED_AT);

    expect(result.box).toBe(4);
    expect(result.dueOn).toBe('2026-08-22'); // today + 7, not tomorrow
  });

  it('walks a word from new to consolidated along the documented intervals', () => {
    const days = ['2026-08-15', '2026-08-16', '2026-08-19', '2026-08-26', '2026-09-11'];
    const expectedDue = ['2026-08-16', '2026-08-19', '2026-08-26', '2026-09-11', '2026-10-11'];

    let state = createCardState('l01-w001', '2026-08-15');

    days.forEach((day, index) => {
      state = review(state, 'sure', day, REVIEWED_AT);
      expect(state.dueOn).toBe(expectedDue[index]);
    });

    expect(state.box).toBe(5);
    expect(state.consolidated).toBe(true);
  });
});

describe('landsInDrillBox', () => {
  it('is true exactly for box 1', () => {
    expect(landsInDrillBox(card({ box: 1 }))).toBe(true);
    expect(landsInDrillBox(card({ box: 2 }))).toBe(false);
  });
});
