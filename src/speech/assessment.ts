/**
 * The pronunciation assessment port.
 *
 * Deliberately provider-neutral: Azure is one adapter behind this interface,
 * not a dependency spread through the components. Swapping in an on-device
 * model, a per-user key or another provider later stays an adapter change
 * (PLAN.md §14).
 *
 * The parsing and grading below are pure, because the network part cannot be
 * exercised in tests — so everything that *can* be tested, is.
 */

export interface PhonemeScore {
  phoneme: string;
  accuracy: number;
}

export interface SyllableScore {
  syllable: string;
  accuracy: number;
}

export interface WordAssessment {
  /** What the service heard, for the case where a different word was said. */
  recognisedText: string;
  /** 0–100, how close the sounds were to the reference. */
  accuracy: number;
  /** 0–100 overall, as reported by the provider. */
  overall: number;
  syllables: SyllableScore[];
  phonemes: PhonemeScore[];
}

export interface AssessOptions {
  /**
   * Fires when the service has decided the speaking is over. From here on the
   * learner is waiting on the network, not being listened to — and a panel
   * that still says "listening" invites them to keep talking into nothing.
   */
  onSpeechEnd?: () => void;
}

export interface PronunciationAssessor {
  /** False when no credentials are configured — the UI hides the button then. */
  isAvailable(): boolean;
  /**
   * Optional warm-up before the first press: loading the provider's SDK and
   * opening its connection costs seconds, and paying that while the learner
   * waits is the difference between usable and annoying.
   */
  prepare?(): Promise<void>;
  /** Records from the microphone and grades against `referenceText`. */
  assess(referenceText: string, options?: AssessOptions): Promise<WordAssessment>;
  /** Releases whatever `prepare` set up. Called when the session ends. */
  dispose?(): void;
}

export class AssessmentError extends Error {}

/** Below this a sound counts as missed rather than merely imperfect. */
export const WEAK_THRESHOLD = 60;
const GOOD_THRESHOLD = 80;
const FAIR_THRESHOLD = 60;

export type VerdictLevel = 'good' | 'fair' | 'poor' | 'wrong-word';

export interface Verdict {
  level: VerdictLevel;
  headline: string;
  detail: string | null;
  /** Weakest syllables, worst first — what the learner should hear again. */
  weakest: SyllableScore[];
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}]/gu, '')
    .trim();
}

/**
 * Turns raw scores into something a learner can act on.
 *
 * A bare number ("72 %") tells nobody what to do differently, which is exactly
 * the gap this feature exists to close — so the verdict always names the
 * weakest syllable when there is one.
 */
export function summarise(assessment: WordAssessment, referenceText: string): Verdict {
  if (normalise(assessment.recognisedText) !== normalise(referenceText)) {
    return {
      level: 'wrong-word',
      headline: 'Ein anderes Wort verstanden',
      detail: assessment.recognisedText
        ? `Erkannt wurde „${assessment.recognisedText}“.`
        : 'Es wurde nichts erkannt — war das Mikrofon an?',
      weakest: [],
    };
  }

  const weakest = [...assessment.syllables]
    .filter((syllable) => syllable.accuracy < GOOD_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 2);

  if (assessment.accuracy >= GOOD_THRESHOLD) {
    return {
      level: 'good',
      headline: 'Sauber ausgesprochen',
      detail: null,
      weakest: [],
    };
  }

  const level: VerdictLevel = assessment.accuracy >= FAIR_THRESHOLD ? 'fair' : 'poor';
  const worst = weakest[0];

  return {
    level,
    headline: level === 'fair' ? 'Fast — eine Stelle hakt' : 'Da war einiges daneben',
    detail: worst ? `Schwächste Silbe: „${worst.syllable}“` : null,
    weakest,
  };
}

interface AzureScored {
  PronunciationAssessment?: {
    AccuracyScore?: number;
    PronScore?: number;
  };
}

/**
 * Reads Azure's raw JSON.
 *
 * The SDK's TypeScript types stop above the phoneme level, so the detail we
 * actually want has to be dug out of the raw response by hand
 * (microsoft/cognitive-services-speech-sdk-js#942). Kept pure and separate so
 * a change in that shape shows up as a failing test, not a blank panel.
 */
export function parseAzureResult(raw: unknown): WordAssessment {
  if (typeof raw !== 'object' || raw === null) {
    throw new AssessmentError('Leere Antwort vom Dienst.');
  }

  const best = (raw as { NBest?: unknown[] }).NBest?.[0];

  if (typeof best !== 'object' || best === null) {
    throw new AssessmentError('Keine Bewertung in der Antwort.');
  }

  const typed = best as AzureScored & {
    Display?: string;
    Words?: Array<
      AzureScored & {
        Syllables?: Array<AzureScored & { Syllable?: string }>;
        Phonemes?: Array<AzureScored & { Phoneme?: string }>;
      }
    >;
  };

  const word = typed.Words?.[0];

  return {
    recognisedText: (typed.Display ?? '').replace(/[.!?]+$/, ''),
    accuracy: word?.PronunciationAssessment?.AccuracyScore ?? typed.PronunciationAssessment?.AccuracyScore ?? 0,
    overall: typed.PronunciationAssessment?.PronScore ?? 0,
    syllables: (word?.Syllables ?? []).map((entry) => ({
      syllable: entry.Syllable ?? '',
      accuracy: entry.PronunciationAssessment?.AccuracyScore ?? 0,
    })),
    phonemes: (word?.Phonemes ?? []).map((entry) => ({
      phoneme: entry.Phoneme ?? '',
      accuracy: entry.PronunciationAssessment?.AccuracyScore ?? 0,
    })),
  };
}
