import { describeStress, gapSentence, posLabel } from './text';

describe('gapSentence', () => {
  it('replaces the target word with a gap', () => {
    expect(gapSentence('The next few weeks will be crucial.', 'crucial')).toBe(
      'The next few weeks will be ______.',
    );
  });

  it('swallows an inflected ending so no letters are left behind', () => {
    expect(gapSentence('She acknowledged the mistake.', 'acknowledge')).toBe(
      'She ______ the mistake.',
    );
  });

  it('swallows a plural ending', () => {
    expect(gapSentence('The qualifications were checked.', 'qualification')).toBe(
      'The ______ were checked.',
    );
  });

  it('matches case-insensitively', () => {
    expect(gapSentence('Crucial decisions were made.', 'crucial')).toBe(
      '______ decisions were made.',
    );
  });

  it('keeps a hyphenated word in one piece', () => {
    expect(gapSentence('A well-established firm.', 'established')).toBe('A ______ firm.');
  });

  it('replaces only the first occurrence', () => {
    expect(gapSentence('A test about a test.', 'test')).toBe('A ______ about a test.');
  });

  it('leaves the sentence alone when the term does not appear', () => {
    expect(gapSentence('Nothing to see.', 'absent')).toBe('Nothing to see.');
  });
});

describe('describeStress', () => {
  it('names the stressed syllable in one-based counting', () => {
    expect(describeStress(3, 1)).toBe('Betonung auf Silbe 2 von 3');
  });

  it('says nothing about stress for a single syllable', () => {
    expect(describeStress(1, 0)).toBe('Eine Silbe');
  });
});

describe('posLabel', () => {
  it('translates the parts of speech into German', () => {
    expect(posLabel('adjective')).toBe('Adjektiv');
    expect(posLabel('noun')).toBe('Substantiv');
  });

  it('falls back to the raw value for anything unknown', () => {
    expect(posLabel('particle')).toBe('particle');
  });
});
