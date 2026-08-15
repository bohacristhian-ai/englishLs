import { compareIsoDate, isDue } from './dates';
import type { CardState, IsoDate, Word } from './types';

/**
 * Picks what to study and drives the queue during a session.
 *
 * Pure by contract, like the rest of `domain/`: the caller passes in the words
 * of the unlocked levels, the stored progress and the current learning day.
 */

export const DEFAULT_SESSION_SIZE = 20;
export const DEFAULT_MAX_NEW_PER_DAY = 10;

/**
 * How often a single card may come back inside one session. Without this cap a
 * session cannot terminate: a word the user keeps missing would return forever.
 */
export const MAX_REPEATS_PER_CARD = 2;

export interface SessionPlanOptions {
  /** Cards to present, repetitions included. */
  targetCards?: number;
  maxNewPerDay?: number;
}

/**
 * Builds the card order for a session: due cards first, lowest box first, then
 * topped up with words never seen before.
 */
export function planSession(
  words: readonly Word[],
  cards: Readonly<Record<string, CardState>>,
  today: IsoDate,
  options: SessionPlanOptions = {},
): string[] {
  const targetCards = options.targetCards ?? DEFAULT_SESSION_SIZE;
  const maxNewPerDay = options.maxNewPerDay ?? DEFAULT_MAX_NEW_PER_DAY;

  const due: CardState[] = [];
  const unseen: Word[] = [];

  for (const word of words) {
    const card = cards[word.id];

    if (!card) {
      unseen.push(word);
    } else if (isDue(card.dueOn, today)) {
      due.push(card);
    }
  }

  due.sort(byBoxThenOldestDue);

  const selected = due.slice(0, targetCards).map((card) => card.wordId);

  const newBudget = Math.max(0, maxNewPerDay - countIntroducedOn(cards, today));
  const freeSlots = Math.min(targetCards - selected.length, newBudget);

  for (const word of unseen.slice(0, Math.max(0, freeSlots))) {
    selected.push(word.id);
  }

  return selected;
}

/** Low boxes are the shakiest, and within a box the longest overdue comes first. */
function byBoxThenOldestDue(a: CardState, b: CardState): number {
  if (a.box !== b.box) return a.box - b.box;

  const byDue = compareIsoDate(a.dueOn, b.dueOn);
  if (byDue !== 0) return byDue;

  // Stable, so a session order never depends on object iteration order.
  return a.wordId < b.wordId ? -1 : a.wordId > b.wordId ? 1 : 0;
}

/** New words already introduced on a given day, across all earlier sessions. */
export function countIntroducedOn(
  cards: Readonly<Record<string, CardState>>,
  day: IsoDate,
): number {
  let count = 0;

  for (const card of Object.values(cards)) {
    if (card.introducedOn === day) count += 1;
  }

  return count;
}

export interface SessionState {
  /** Word ids still to be presented; the head is the current card. */
  readonly queue: readonly string[];
  /** How often each card has been re-queued in this session. */
  readonly repeats: Readonly<Record<string, number>>;
  /** Cards presented so far, repetitions included. */
  readonly presented: number;
  /** Upper bound on presentations, so "a session of 20" really is 20 cards. */
  readonly target: number;
}

export function startSession(wordIds: readonly string[], target: number): SessionState {
  return {
    queue: [...wordIds],
    repeats: {},
    presented: 0,
    target,
  };
}

export function currentCard(state: SessionState): string | null {
  return state.queue[0] ?? null;
}

export function isSessionFinished(state: SessionState): boolean {
  return state.queue.length === 0 || state.presented >= state.target;
}

/**
 * Advances past the current card. `landedInDrillBox` says whether the rating
 * dropped it into box 1 — those come back later in the same session, but at
 * most `MAX_REPEATS_PER_CARD` times.
 */
export function recordAnswer(state: SessionState, landedInDrillBox: boolean): SessionState {
  const wordId = state.queue[0];

  if (wordId === undefined) return state;

  const remaining = state.queue.slice(1);
  const presented = state.presented + 1;
  const used = state.repeats[wordId] ?? 0;
  const repeat = landedInDrillBox && used < MAX_REPEATS_PER_CARD && presented < state.target;

  return {
    queue: repeat ? [...remaining, wordId] : remaining,
    repeats: repeat ? { ...state.repeats, [wordId]: used + 1 } : state.repeats,
    presented,
    target: state.target,
  };
}
