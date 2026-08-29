import PronunciationPanel from './PronunciationPanel';
import RatingBar from './RatingBar';
import { gapSentence, posLabel } from '../domain/text';
import { RATE_NORMAL, RATE_SLOW } from '../speech/tts';
import type { Direction, Rating, Word } from '../domain/types';

interface FlashcardProps {
  word: Word;
  direction: Direction;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: Rating) => void;
  onPlayWord: (rate: number) => void;
  onPlaySentence: () => void;
  speechMessage?: string | null;
}

export default function Flashcard({
  word,
  direction,
  revealed,
  onReveal,
  onRate,
  onPlayWord,
  onPlaySentence,
  speechMessage,
}: FlashcardProps) {
  return (
    <article className="card">
      {revealed ? (
        <>
          <h2 className="card__term" lang="en">
            {word.term}
          </h2>
          <p className="card__pos">{posLabel(word.pos)}</p>

          <PronunciationPanel
            word={word}
            onPlayWord={onPlayWord}
            onPlaySentence={onPlaySentence}
            speechMessage={speechMessage}
          />

          {direction === 'en-de' && <p className="card__translation">{word.translation}</p>}

          <RatingBar onRate={onRate} />
        </>
      ) : (
        <>
          {direction === 'de-en' ? (
            <FrontDeEn word={word} />
          ) : (
            <FrontEnDe word={word} onPlayWord={onPlayWord} />
          )}

          <button type="button" className="card__reveal" onClick={onReveal}>
            Auflösen
          </button>
        </>
      )}
    </article>
  );
}

/**
 * Productive direction: German meaning plus a gapped sentence. No English word,
 * no transcription and — importantly — no audio, since any of those would hand
 * over the answer.
 */
function FrontDeEn({ word }: { word: Word }) {
  return (
    <>
      <h2 className="card__prompt">{word.translation}</h2>
      <p className="card__pos">{posLabel(word.pos)}</p>
      <p className="card__gap" lang="en">
        {gapSentence(word.example, word.term)}
      </p>
      <p className="card__hint">Sprich das englische Wort laut aus.</p>
    </>
  );
}

/** Receptive direction: the word is shown and may be heard before revealing. */
function FrontEnDe({ word, onPlayWord }: { word: Word; onPlayWord: (rate: number) => void }) {
  return (
    <>
      <h2 className="card__term" lang="en">
        {word.term}
      </h2>
      <p className="card__pos">{posLabel(word.pos)}</p>

      <div className="card__actions">
        <button type="button" onClick={() => onPlayWord(RATE_NORMAL)}>
          🔊 Anhören
        </button>
        <button type="button" onClick={() => onPlayWord(RATE_SLOW)}>
          🐢 Langsam
        </button>
      </div>

      <p className="card__hint">Sprich das Wort laut nach.</p>
    </>
  );
}
