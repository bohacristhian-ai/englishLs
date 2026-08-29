import type { Pos, Word } from '../domain/types';
import level01 from './levels/level-01.json';
import level02 from './levels/level-02.json';
import level03 from './levels/level-03.json';
import level04 from './levels/level-04.json';
import level05 from './levels/level-05.json';
import level06 from './levels/level-06.json';
import level07 from './levels/level-07.json';
import level08 from './levels/level-08.json';
import level09 from './levels/level-09.json';
import level10 from './levels/level-10.json';

/**
 * Loading and validating the word data.
 *
 * The validation is not ceremony: these files are hand-curated, and an error in
 * them puts a *wrong pronunciation* in front of the learner. Everything that can
 * be checked mechanically is checked here.
 */

export const POS_VALUES = ['verb', 'noun', 'adjective', 'adverb', 'phrase'] as const;

export const PRIMARY_STRESS = 'ˈ';
export const SECONDARY_STRESS = 'ˌ';
export const SYLLABLE_SEPARATOR = '.';

const SEPARATORS = new Set([PRIMARY_STRESS, SECONDARY_STRESS, SYLLABLE_SEPARATOR]);

const ID_PATTERN = /^l(\d{2})-w(\d{3})$/;

export interface IpaSyllables {
  syllables: string[];
  /** Index of the syllable carrying primary stress, or -1 if unmarked. */
  stressIndex: number;
}

/**
 * Splits a Cambridge-style transcription into syllables.
 *
 * Cambridge separates syllables with `.` and replaces that separator with the
 * stress mark on a stressed syllable, so `əkˈnɒl.ɪdʒ` is ək | nɒl | ɪdʒ with
 * primary stress on index 1. Parsing it gives us an exact syllable count and
 * stress position to check the hand-written fields against.
 */
export function parseIpa(ipa: string): IpaSyllables {
  const syllables: string[] = [];
  let current = '';
  let stressIndex = -1;

  for (const char of ipa) {
    if (!SEPARATORS.has(char)) {
      current += char;
      continue;
    }

    if (current !== '') {
      syllables.push(current);
      current = '';
    }

    if (char === PRIMARY_STRESS) {
      stressIndex = syllables.length;
    }
  }

  if (current !== '') {
    syllables.push(current);
  }

  return { syllables, stressIndex };
}

/** Transcription without separators, for places that want it read as one unit. */
export function plainIpa(ipa: string): string {
  return [...ipa].filter((char) => !SEPARATORS.has(char)).join('');
}

export interface ValidationIssue {
  /** Word id, or `#index` while the id itself is unusable. */
  where: string;
  field: string;
  message: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function countOccurrences(text: string, char: string): number {
  return [...text].filter((candidate) => candidate === char).length;
}

/**
 * Checks one entry in isolation. `index` is only used to point at entries whose
 * id is missing or malformed.
 */
export function validateWord(entry: unknown, index: number, level: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const where = isRecord(entry) && isNonEmptyString(entry['id']) ? entry['id'] : `#${index}`;

  const add = (field: string, message: string): void => {
    issues.push({ where, field, message });
  };

  if (!isRecord(entry)) {
    add('-', 'Entry is not an object');

    return issues;
  }

  for (const field of ['term', 'translation', 'example', 'exampleDe', 'ipaGb'] as const) {
    if (!isNonEmptyString(entry[field])) add(field, 'Missing or empty');
  }

  const id = entry['id'];
  if (!isNonEmptyString(id)) {
    add('id', 'Missing or empty');
  } else {
    const match = ID_PATTERN.exec(id);

    if (!match) {
      add('id', `Expected the form l01-w001, got "${id}"`);
    } else if (Number(match[1]) !== level) {
      add('id', `Level prefix does not match level ${level}`);
    }
  }

  if (entry['level'] !== level) {
    add('level', `Expected ${level}, got ${String(entry['level'])}`);
  }

  if (!POS_VALUES.includes(entry['pos'] as Pos)) {
    add('pos', `Expected one of ${POS_VALUES.join(', ')}, got ${String(entry['pos'])}`);
  }

  const syllables = entry['syllables'];
  const validSyllables =
    Array.isArray(syllables) && syllables.length > 0 && syllables.every(isNonEmptyString);

  if (!validSyllables) {
    add('syllables', 'Expected a non-empty array of non-empty strings');
  }

  const stressIndex = entry['stressIndex'];
  const validStress = typeof stressIndex === 'number' && Number.isInteger(stressIndex);

  if (!validStress) {
    add('stressIndex', 'Expected an integer');
  } else if (validSyllables && (stressIndex < 0 || stressIndex >= syllables.length)) {
    add('stressIndex', `Out of range for ${syllables.length} syllables: ${stressIndex}`);
  }

  const ipaGb = entry['ipaGb'];

  if (isNonEmptyString(ipaGb)) {
    const marks = countOccurrences(ipaGb, PRIMARY_STRESS);

    if (marks !== 1) {
      add('ipaGb', `Expected exactly one ${PRIMARY_STRESS}, found ${marks}`);
    }

    const parsed = parseIpa(ipaGb);

    if (validSyllables && parsed.syllables.length !== syllables.length) {
      add(
        'ipaGb',
        `Syllable count disagrees: ipaGb has ${parsed.syllables.length}, syllables has ${syllables.length}`,
      );
    }

    if (marks === 1 && validStress && parsed.stressIndex !== stressIndex) {
      add(
        'stressIndex',
        `Disagrees with ${PRIMARY_STRESS} in ipaGb, which marks syllable ${parsed.stressIndex}`,
      );
    }
  }

  for (const field of ['ipaUs', 'note'] as const) {
    const value = entry[field];

    if (value !== undefined && !isNonEmptyString(value)) {
      add(field, 'Present but empty — omit it instead');
    }
  }

  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks a whole level file, including the cross-entry rules. */
export function validateLevel(entries: unknown, level: number): ValidationIssue[] {
  if (!Array.isArray(entries)) {
    return [{ where: `level-${level}`, field: '-', message: 'Expected an array of words' }];
  }

  const issues = entries.flatMap((entry, index) => validateWord(entry, index, level));

  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    if (!isRecord(entry)) return;

    const id = entry['id'];
    if (!isNonEmptyString(id)) return;

    if (seen.has(id)) {
      issues.push({ where: id, field: 'id', message: 'Duplicate id' });
    }
    seen.add(id);

    // Ids must run without gaps so a missing word is impossible to overlook.
    const expected = `l${String(level).padStart(2, '0')}-w${String(index + 1).padStart(3, '0')}`;

    if (id !== expected) {
      issues.push({ where: id, field: 'id', message: `Out of sequence, expected ${expected}` });
    }
  });

  return issues;
}

export function formatIssues(issues: readonly ValidationIssue[]): string {
  return issues.map((issue) => `${issue.where} · ${issue.field}: ${issue.message}`).join('\n');
}

const LEVEL_FILES: Readonly<Record<number, unknown>> = {
  1: level01,
  2: level02,
  3: level03,
  4: level04,
  5: level05,
  6: level06,
  7: level07,
  8: level08,
  9: level09,
  10: level10,
};

const cache = new Map<number, Word[]>();

/** Returns the words of a level, or throws if the data does not validate. */
export function getLevel(level: number): Word[] {
  const cached = cache.get(level);
  if (cached) return cached;

  const raw = LEVEL_FILES[level];

  if (raw === undefined) {
    throw new Error(`No word data for level ${level}`);
  }

  const issues = validateLevel(raw, level);

  if (issues.length > 0) {
    throw new Error(`Invalid word data in level ${level}:\n${formatIssues(issues)}`);
  }

  const words = raw as Word[];
  cache.set(level, words);

  return words;
}

/** Levels that ship with word data. */
export function availableLevels(): number[] {
  return Object.keys(LEVEL_FILES)
    .map(Number)
    .sort((a, b) => a - b);
}
