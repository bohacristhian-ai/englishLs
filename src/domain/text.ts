/**
 * Text shaping for the card fronts. Pure, so it can be tested without a DOM.
 */

const GAP = '______';

/** Letters that still belong to the same word, across languages and hyphenation. */
const WORD_CHARACTER = /[\p{L}\p{M}'’-]/u;

/**
 * Replaces the target word in a sentence with a gap.
 *
 * In de-en mode the German translation alone is ambiguous — „anerkennen"
 * fits acknowledge, admit and recognise equally well. The sentence with a gap
 * is what makes the prompt answerable, so the gap has to swallow the *whole*
 * word including any inflection: "acknowledged" must not leave a stray "d".
 */
export function gapSentence(sentence: string, term: string): string {
  const start = sentence.toLowerCase().indexOf(term.toLowerCase());

  if (start === -1) return sentence;

  let from = start;
  let to = start + term.length;

  while (from > 0 && WORD_CHARACTER.test(sentence[from - 1] ?? '')) from -= 1;
  while (to < sentence.length && WORD_CHARACTER.test(sentence[to] ?? '')) to += 1;

  return sentence.slice(0, from) + GAP + sentence.slice(to);
}

/** Human-readable stress position, for screen readers and the panel caption. */
export function describeStress(syllableCount: number, stressIndex: number): string {
  if (syllableCount <= 1) return 'Eine Silbe';

  return `Betonung auf Silbe ${stressIndex + 1} von ${syllableCount}`;
}

const POS_LABELS: Readonly<Record<string, string>> = {
  verb: 'Verb',
  noun: 'Substantiv',
  adjective: 'Adjektiv',
  adverb: 'Adverb',
  phrase: 'Wendung',
};

export function posLabel(pos: string): string {
  return POS_LABELS[pos] ?? pos;
}
