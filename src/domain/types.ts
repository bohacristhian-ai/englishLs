/** Part of speech. Exactly one value per word — see the curation rules in CLAUDE.md. */
export type Pos = 'verb' | 'noun' | 'adjective' | 'adverb' | 'phrase';

/** A calendar day in local time, `YYYY-MM-DD`. Never a UTC timestamp. */
export type IsoDate = string;

/** Leitner box. Five of them, 1 is the drill box and 5 is long-term. */
export type Box = 1 | 2 | 3 | 4 | 5;

/** The three-step self-assessment. Acts on the box and nothing else. */
export type Rating = 'again' | 'unsure' | 'sure';

/**
 * Which way round a card is asked. A presentation choice of the session —
 * there is one CardState per word, not one per direction.
 */
export type Direction = 'de-en' | 'en-de';

/** A vocabulary entry. Static, shipped with the app, never mutated at runtime. */
export interface Word {
  /** Stable forever — progress references it. Changing an id discards progress. */
  id: string;
  level: number;
  term: string;
  pos: Pos;
  /** British English, sourced from Cambridge. Carries exactly one primary stress mark. */
  ipaGb: string;
  ipaUs?: string;
  /** Cut phonetically, not orthographically. */
  syllables: string[];
  /** 0-based, must agree with the position of ˈ in ipaGb. */
  stressIndex: number;
  translation: string;
  example: string;
  exampleDe: string;
  note?: string;
}

/** What the app remembers about one word. Lives in localStorage. */
export interface CardState {
  wordId: string;
  box: Box;
  dueOn: IsoDate;
  /** The learning day this word was first introduced — caps new words per day. */
  introducedOn: IsoDate;
  /** ISO timestamp, or null while the card has only been introduced. */
  lastReviewedAt: string | null;
  correctStreak: number;
  totalCorrect: number;
  totalWrong: number;
  /** True once the card was confirmed with "sure" while already in box 5. */
  consolidated: boolean;
}
