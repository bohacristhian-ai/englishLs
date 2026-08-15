import { addDays } from './dates';
import type { Box, CardState, IsoDate, Rating } from './types';

/**
 * The single home of the Leitner rules. Intervals, box movements and due dates
 * are computed here and nowhere else — not even "briefly" inside a component.
 *
 * Pure by contract: no React, no storage, no `new Date()`. The current day and
 * the review timestamp are handed in.
 */

export const MIN_BOX: Box = 1;
export const MAX_BOX: Box = 5;

/** Days until the next repetition, per box. */
export const BOX_INTERVAL_DAYS: Readonly<Record<Box, number>> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 16,
};

/**
 * The one exception to `dueOn = today + interval(newBox)`: confirming a card
 * that already sits in box 5 marks it consolidated and pushes it out 30 days.
 */
export const CONSOLIDATED_INTERVAL_DAYS = 30;

export function nextBox(box: Box, rating: Rating): Box {
  switch (rating) {
    case 'again':
      return MIN_BOX;
    case 'unsure':
      return Math.max(MIN_BOX, box - 1) as Box;
    case 'sure':
      return Math.min(MAX_BOX, box + 1) as Box;
  }
}

/** True when this review confirms a card that is already in the last box. */
function confirmsLastBox(box: Box, rating: Rating): boolean {
  return rating === 'sure' && box === MAX_BOX;
}

/** Days until this card comes back, given the box it was in and the rating. */
export function intervalDaysFor(box: Box, rating: Rating): number {
  if (confirmsLastBox(box, rating)) {
    return CONSOLIDATED_INTERVAL_DAYS;
  }

  return BOX_INTERVAL_DAYS[nextBox(box, rating)];
}

/** A word seen for the first time: box 1, due immediately. */
export function createCardState(wordId: string, today: IsoDate): CardState {
  return {
    wordId,
    box: MIN_BOX,
    dueOn: today,
    introducedOn: today,
    lastReviewedAt: null,
    correctStreak: 0,
    totalCorrect: 0,
    totalWrong: 0,
    consolidated: false,
  };
}

/**
 * Applies one rating. Returns a new CardState; the input is not touched.
 *
 * `correctStreak` counts consecutive "sure" ratings. "unsure" leaves it alone
 * rather than resetting it — the box already carries the penalty, and counting
 * a hesitant hit as a full break would punish the same answer twice.
 */
export function review(
  card: CardState,
  rating: Rating,
  today: IsoDate,
  reviewedAt: Date,
): CardState {
  const box = nextBox(card.box, rating);

  return {
    ...card,
    box,
    dueOn: addDays(today, intervalDaysFor(card.box, rating)),
    lastReviewedAt: reviewedAt.toISOString(),
    correctStreak: rating === 'again' ? 0 : rating === 'sure' ? card.correctStreak + 1 : card.correctStreak,
    totalCorrect: rating === 'sure' ? card.totalCorrect + 1 : card.totalCorrect,
    totalWrong: rating === 'again' ? card.totalWrong + 1 : card.totalWrong,
    consolidated: confirmsLastBox(card.box, rating),
  };
}

/** Cards that land in box 1 are drilled again later in the same session. */
export function landsInDrillBox(card: CardState): boolean {
  return card.box === MIN_BOX;
}
