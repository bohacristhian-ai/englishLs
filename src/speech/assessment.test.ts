import { WEAK_THRESHOLD, parseAzureResult, summarise } from './assessment';
import type { WordAssessment } from './assessment';

/** Shape of a real Azure response with phoneme granularity. */
const AZURE_RESPONSE = {
  NBest: [
    {
      Display: 'acknowledge.',
      PronunciationAssessment: { AccuracyScore: 72, PronScore: 78 },
      Words: [
        {
          Word: 'acknowledge',
          PronunciationAssessment: { AccuracyScore: 72, ErrorType: 'None' },
          Syllables: [
            { Syllable: 'ək', PronunciationAssessment: { AccuracyScore: 88 } },
            { Syllable: 'nɒl', PronunciationAssessment: { AccuracyScore: 45 } },
            { Syllable: 'ɪdʒ', PronunciationAssessment: { AccuracyScore: 79 } },
          ],
          Phonemes: [
            { Phoneme: 'ə', PronunciationAssessment: { AccuracyScore: 90 } },
            { Phoneme: 'k', PronunciationAssessment: { AccuracyScore: 86 } },
            { Phoneme: 'n', PronunciationAssessment: { AccuracyScore: 40 } },
          ],
        },
      ],
    },
  ],
};

function assessment(overrides: Partial<WordAssessment> = {}): WordAssessment {
  return {
    recognisedText: 'acknowledge',
    accuracy: 90,
    overall: 90,
    syllables: [],
    phonemes: [],
    ...overrides,
  };
}

describe('parseAzureResult', () => {
  it('reads the word, syllable and phoneme scores', () => {
    const result = parseAzureResult(AZURE_RESPONSE);

    expect(result.recognisedText).toBe('acknowledge');
    expect(result.accuracy).toBe(72);
    expect(result.overall).toBe(78);
    expect(result.syllables).toHaveLength(3);
    expect(result.syllables[1]).toEqual({ syllable: 'nɒl', accuracy: 45 });
    expect(result.phonemes[2]).toEqual({ phoneme: 'n', accuracy: 40 });
  });

  it('strips the trailing punctuation Azure adds to the display form', () => {
    expect(parseAzureResult(AZURE_RESPONSE).recognisedText).not.toContain('.');
  });

  it('survives a response without syllable detail', () => {
    const thin = { NBest: [{ Display: 'crucial', PronunciationAssessment: { AccuracyScore: 80 } }] };

    expect(parseAzureResult(thin).syllables).toEqual([]);
  });

  it('throws on an empty or malformed response', () => {
    expect(() => parseAzureResult(null)).toThrow();
    expect(() => parseAzureResult({})).toThrow();
    expect(() => parseAzureResult({ NBest: [] })).toThrow();
  });
});

describe('summarise', () => {
  it('passes a clean attempt', () => {
    const verdict = summarise(assessment({ accuracy: 92 }), 'acknowledge');

    expect(verdict.level).toBe('good');
    expect(verdict.weakest).toEqual([]);
  });

  it('names the weakest syllable rather than only a number', () => {
    // A bare percentage tells nobody what to do differently.
    const verdict = summarise(
      assessment({
        accuracy: 70,
        syllables: [
          { syllable: 'ək', accuracy: 88 },
          { syllable: 'nɒl', accuracy: 45 },
        ],
      }),
      'acknowledge',
    );

    expect(verdict.level).toBe('fair');
    expect(verdict.detail).toContain('nɒl');
    expect(verdict.weakest[0]?.syllable).toBe('nɒl');
  });

  it('grades a poor attempt below the fair threshold', () => {
    expect(summarise(assessment({ accuracy: 40 }), 'acknowledge').level).toBe('poor');
  });

  it('reports a different word instead of scoring it', () => {
    const verdict = summarise(
      assessment({ recognisedText: 'knowledge', accuracy: 95 }),
      'acknowledge',
    );

    expect(verdict.level).toBe('wrong-word');
    expect(verdict.detail).toContain('knowledge');
  });

  it('ignores case and punctuation when comparing the word', () => {
    const verdict = summarise(assessment({ recognisedText: 'Acknowledge.' }), 'acknowledge');

    expect(verdict.level).not.toBe('wrong-word');
  });

  it('says so when nothing was picked up at all', () => {
    const verdict = summarise(assessment({ recognisedText: '' }), 'acknowledge');

    expect(verdict.level).toBe('wrong-word');
    expect(verdict.detail).toMatch(/Mikrofon/);
  });

  it('lists at most two weak syllables so the hint stays actionable', () => {
    const verdict = summarise(
      assessment({
        accuracy: 50,
        syllables: [
          { syllable: 'a', accuracy: 10 },
          { syllable: 'b', accuracy: 20 },
          { syllable: 'c', accuracy: 30 },
        ],
      }),
      'acknowledge',
    );

    expect(verdict.weakest).toHaveLength(2);
    expect(verdict.weakest.map((s) => s.syllable)).toEqual(['a', 'b']);
  });

  it('marks a genuinely missed sound below the weak threshold', () => {
    expect(WEAK_THRESHOLD).toBeLessThan(80);
  });
});
