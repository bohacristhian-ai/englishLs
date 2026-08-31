import PronunciationCheck from './PronunciationCheck';
import PronunciationPanel from './PronunciationPanel';
import RatingBar from './RatingBar';
import { gapSentence, posLabel } from '../domain/text';
import { RATE_NORMAL, RATE_SLOW } from '../speech/tts';
import type { PronunciationAssessor } from '../speech/assessment';
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
  assessor: PronunciationAssessor;
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
  assessor,
}: FlashcardProps) {
  // With a microphone available, speaking is the way through the card and
  // "Auflösen" steps back to being the way out for a noisy room.
  const speakFirst = assessor.isAvailable();

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
        </>
      ) : direction === 'de-en' ? (
        <FrontDeEn word={word} speakFirst={speakFirst} />
      ) : (
        <FrontEnDe word={word} onPlayWord={onPlayWord} speakFirst={speakFirst} />
      )}

      {/*
        Stays mounted across the reveal — the recording happens on the front and
        its verdict is shown on the back, so unmounting here would throw the
        attempt away. The key resets it for the next word instead.
      */}
      <PronunciationCheck
        key={word.id}
        term={word.term}
        assessor={assessor}
        revealed={revealed}
        onRecorded={onReveal}
      />

      {revealed ? (
        <RatingBar onRate={onRate} />
      ) : (
        <button
          type="button"
          className={speakFirst ? 'card__reveal card__reveal--secondary' : 'card__reveal'}
          onClick={onReveal}
        >
          Auflösen
        </button>
      )}
    </article>
  );
}

/**
 * Productive direction: German meaning plus a gapped sentence. No English word,
 * no transcription and — importantly — no audio, since any of those would hand
 * over the answer.
 */
function FrontDeEn({ word, speakFirst }: { word: Word; speakFirst: boolean }) {
  return (
    <>
      <h2 className="card__prompt">{word.translation}</h2>
      <p className="card__pos">{posLabel(word.pos)}</p>
      <p className="card__gap" lang="en">
        {gapSentence(word.example, word.term)}
      </p>
      <p className="card__hint">
        Sprich das englische Wort laut aus.
        {speakFirst && ' Die Aufnahme deckt die Karte auf.'}
      </p>
    </>
  );
}

/** Receptive direction: the word is shown and may be heard before revealing. */
function FrontEnDe({
  word,
  onPlayWord,
  speakFirst,
}: {
  word: Word;
  onPlayWord: (rate: number) => void;
  speakFirst: boolean;
}) {
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

      <p className="card__hint">
        Sprich das Wort laut nach.
        {speakFirst && ' Die Aufnahme deckt die Karte auf.'}
      </p>
    </>
  );
}
