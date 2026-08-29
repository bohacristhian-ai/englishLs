import { RATE_NORMAL, RATE_SLOW } from '../speech/tts';
import { describeStress } from '../domain/text';
import type { Word } from '../domain/types';

interface PronunciationPanelProps {
  word: Word;
  onPlayWord: (rate: number) => void;
  onPlaySentence: () => void;
  /** Shown when speech is unavailable, so the card never fails silently. */
  speechMessage?: string | null;
}

/**
 * The visual heart of the card back: syllables with the stressed one marked,
 * the transcription, and the trap note.
 *
 * It sits directly above the rating buttons on purpose. Self-assessment of
 * pronunciation is a weak signal (see PLAN.md §13.1); having the target right
 * next to the judgement is one of the two things that dampens the bias.
 */
export default function PronunciationPanel({
  word,
  onPlayWord,
  onPlaySentence,
  speechMessage,
}: PronunciationPanelProps) {
  const stressCaption = describeStress(word.syllables.length, word.stressIndex);

  return (
    <section className="pronunciation" aria-label="Aussprache">
      <ol className="pronunciation__syllables">
        {word.syllables.map((syllable, index) => {
          const stressed = index === word.stressIndex;

          return (
            <li
              key={`${syllable}-${index}`}
              className={stressed ? 'syllable syllable--stressed' : 'syllable'}
            >
              {stressed && (
                <span className="syllable__mark" aria-hidden="true">
                  ˈ
                </span>
              )}
              {syllable}
            </li>
          );
        })}
      </ol>

      <p className="pronunciation__stress">{stressCaption}</p>

      {/* Screen readers announce IPA as gibberish, so it is hidden from them
          and the stress caption above carries the same information as text. */}
      <p className="pronunciation__ipa" aria-hidden="true">
        /{word.ipaGb}/
      </p>

      <div className="pronunciation__actions">
        <button type="button" onClick={() => onPlayWord(RATE_NORMAL)}>
          🔊 Anhören
        </button>
        <button type="button" onClick={() => onPlayWord(RATE_SLOW)}>
          🐢 Langsam
        </button>
      </div>

      {word.note && <p className="pronunciation__note">{word.note}</p>}

      {speechMessage && (
        <p className="pronunciation__warning" role="status">
          {speechMessage}
        </p>
      )}

      <div className="pronunciation__example">
        <p lang="en">{word.example}</p>
        <button type="button" onClick={onPlaySentence}>
          🔊 Satz anhören
        </button>
        <p className="pronunciation__example-de">{word.exampleDe}</p>
      </div>
    </section>
  );
}
