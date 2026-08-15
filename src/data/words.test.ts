import level01 from './levels/level-01.json';
import {
  POS_VALUES,
  availableLevels,
  formatIssues,
  getLevel,
  parseIpa,
  plainIpa,
  validateLevel,
  validateWord,
} from './words';

function validEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'l01-w001',
    level: 1,
    term: 'crucial',
    pos: 'adjective',
    ipaGb: 'ˈkruː.ʃəl',
    syllables: ['cru', 'cial'],
    stressIndex: 0,
    translation: 'entscheidend',
    example: 'The next few weeks will be crucial.',
    exampleDe: 'Die nächsten Wochen werden entscheidend sein.',
    ...overrides,
  };
}

function fields(issues: ReturnType<typeof validateWord>): string[] {
  return issues.map((issue) => issue.field);
}

describe('parseIpa', () => {
  it('splits on Cambridge syllable dots', () => {
    expect(parseIpa('ˈkruː.ʃəl').syllables).toEqual(['kruː', 'ʃəl']);
  });

  it('treats the stress mark itself as a syllable boundary', () => {
    expect(parseIpa('əkˈnɒl.ɪdʒ').syllables).toEqual(['ək', 'nɒl', 'ɪdʒ']);
  });

  it('reports the stressed syllable index', () => {
    expect(parseIpa('ˈkruː.ʃəl').stressIndex).toBe(0);
    expect(parseIpa('əkˈnɒl.ɪdʒ').stressIndex).toBe(1);
    expect(parseIpa('ˌben.ɪˈfɪʃ.əl').stressIndex).toBe(2);
  });

  it('counts a secondary stress mark as a boundary without claiming the stress', () => {
    const parsed = parseIpa('ˌkjʊə.riˈɒs.ə.ti');

    expect(parsed.syllables).toEqual(['kjʊə', 'ri', 'ɒs', 'ə', 'ti']);
    expect(parsed.stressIndex).toBe(2);
  });

  it('reports -1 when no primary stress is marked', () => {
    expect(parseIpa('kruː.ʃəl').stressIndex).toBe(-1);
  });

  it('handles a single-syllable transcription', () => {
    expect(parseIpa('ˈθʌr')).toEqual({ syllables: ['θʌr'], stressIndex: 0 });
  });
});

describe('plainIpa', () => {
  it('strips separators but keeps the phonemes', () => {
    expect(plainIpa('əkˈnɒl.ɪdʒ')).toBe('əknɒlɪdʒ');
  });
});

describe('validateWord', () => {
  it('accepts a well-formed entry', () => {
    expect(validateWord(validEntry(), 0, 1)).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateWord('crucial', 0, 1)).toHaveLength(1);
  });

  it('flags missing text fields', () => {
    const issues = validateWord(validEntry({ term: '', translation: '   ' }), 0, 1);

    expect(fields(issues)).toEqual(expect.arrayContaining(['term', 'translation']));
  });

  it('flags an id that does not follow the scheme', () => {
    expect(fields(validateWord(validEntry({ id: 'word-1' }), 0, 1))).toContain('id');
  });

  it('flags a level mismatch', () => {
    expect(fields(validateWord(validEntry({ level: 2 }), 0, 1))).toContain('level');
  });

  it('flags a part of speech outside the allowed list', () => {
    expect(fields(validateWord(validEntry({ pos: 'adj' }), 0, 1))).toContain('pos');
  });

  it('accepts every allowed part of speech', () => {
    for (const pos of POS_VALUES) {
      expect(validateWord(validEntry({ pos }), 0, 1)).toEqual([]);
    }
  });

  it('flags a stress index outside the syllables', () => {
    const issues = validateWord(
      validEntry({ ipaGb: 'kruː.ˈʃəl', syllables: ['cru', 'cial'], stressIndex: 2 }),
      0,
      1,
    );

    expect(fields(issues)).toContain('stressIndex');
  });

  it('flags a missing primary stress mark', () => {
    expect(fields(validateWord(validEntry({ ipaGb: 'kruː.ʃəl' }), 0, 1))).toContain('ipaGb');
  });

  it('flags more than one primary stress mark', () => {
    expect(fields(validateWord(validEntry({ ipaGb: 'ˈkruːˈ.ʃəl' }), 0, 1))).toContain('ipaGb');
  });

  it('flags a syllable count that disagrees with the transcription', () => {
    const issues = validateWord(
      validEntry({ syllables: ['cru', 'ci', 'al'], stressIndex: 0 }),
      0,
      1,
    );

    expect(fields(issues)).toContain('ipaGb');
  });

  it('flags a stress index that disagrees with the transcription', () => {
    // ipaGb marks the first syllable, the field claims the second.
    const issues = validateWord(validEntry({ stressIndex: 1 }), 0, 1);

    expect(fields(issues)).toContain('stressIndex');
  });

  it('flags an optional field that is present but empty', () => {
    expect(fields(validateWord(validEntry({ note: '' }), 0, 1))).toContain('note');
  });

  it('accepts an entry that omits the optional fields', () => {
    expect(validateWord(validEntry(), 0, 1)).toEqual([]);
  });
});

describe('validateLevel', () => {
  it('rejects anything that is not an array', () => {
    expect(validateLevel({ words: [] }, 1)).toHaveLength(1);
  });

  it('flags duplicate ids', () => {
    const issues = validateLevel([validEntry(), validEntry()], 1);

    expect(issues.some((issue) => issue.message === 'Duplicate id')).toBe(true);
  });

  it('flags a gap in the id sequence', () => {
    const issues = validateLevel([validEntry(), validEntry({ id: 'l01-w003' })], 1);

    expect(issues.some((issue) => issue.message.includes('Out of sequence'))).toBe(true);
  });

  it('accepts a gapless sequence', () => {
    const entries = [validEntry(), validEntry({ id: 'l01-w002' })];

    expect(validateLevel(entries, 1)).toEqual([]);
  });
});

describe('formatIssues', () => {
  it('renders one line per issue', () => {
    const text = formatIssues([{ where: 'l01-w001', field: 'pos', message: 'Bad' }]);

    expect(text).toBe('l01-w001 · pos: Bad');
  });
});

describe('level 1 word data', () => {
  it('passes validation', () => {
    expect(formatIssues(validateLevel(level01, 1))).toBe('');
  });

  it('holds exactly 50 words', () => {
    expect(level01).toHaveLength(50);
  });

  it('loads through getLevel', () => {
    expect(getLevel(1)).toHaveLength(50);
  });

  it('throws for a level that ships no data', () => {
    expect(() => getLevel(2)).toThrow(/No word data/);
  });

  it('reports which levels ship data', () => {
    expect(availableLevels()).toEqual([1]);
  });

  it('has no duplicate terms', () => {
    const terms = level01.map((word) => word.term);

    expect(new Set(terms).size).toBe(terms.length);
  });

  it('uses each example sentence to contain its own target word', () => {
    // In de-en mode the sentence becomes the gap that disambiguates the prompt,
    // so the term has to actually appear in it.
    const missing = level01
      .filter((word) => !word.example.toLowerCase().includes(word.term.toLowerCase()))
      .map((word) => word.term);

    expect(missing).toEqual([]);
  });

  it('keeps the British -ise spelling convention', () => {
    const wrongSpelling = level01
      .filter((word) => /i[sz]e$/.test(word.term) && word.term.endsWith('ize'))
      .map((word) => word.term);

    expect(wrongSpelling).toEqual([]);
  });

  it('gives every word a German translation and example', () => {
    for (const word of level01) {
      expect(word.translation.length).toBeGreaterThan(2);
      expect(word.exampleDe.length).toBeGreaterThan(10);
    }
  });
});
