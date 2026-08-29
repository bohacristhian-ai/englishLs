import { useCallback, useEffect, useMemo, useState } from 'react';

import Flashcard from '../components/Flashcard';
import { getLevel } from '../data/words';
import { learningDay } from '../domain/dates';
import { createCardState, landsInDrillBox, review } from '../domain/leitner';
import {
  currentCard,
  isSessionFinished,
  planSession,
  recordAnswer,
  startSession,
} from '../domain/scheduler';
import type { Direction, Rating, Word } from '../domain/types';
import { useProgressStore } from '../store/progressStore';
import { useSettingsStore } from '../store/settingsStore';
import { AzurePronunciationAssessor } from '../speech/azureAssessor';
import { speak } from '../speech/tts';
import type { SessionResult } from './Summary';

interface SessionProps {
  level: number;
  direction: Direction;
  targetCards: number;
  onFinish: (result: SessionResult) => void;
  onQuit: () => void;
}

const EMPTY_TALLY: SessionResult = { presented: 0, again: 0, unsure: 0, sure: 0 };

// Stateless, so one instance for the whole session is enough.
const assessor = new AzurePronunciationAssessor();

export default function Session({
  level,
  direction,
  targetCards,
  onFinish,
  onQuit,
}: SessionProps) {
  const cards = useProgressStore((state) => state.cards);
  const rate = useProgressStore((state) => state.rate);
  const dayStartHour = useSettingsStore((state) => state.dayStartHour);

  const words = useMemo(() => getLevel(level), [level]);
  const wordsById = useMemo(() => new Map(words.map((word) => [word.id, word])), [words]);

  const [session, setSession] = useState(() =>
    startSession(
      planSession(words, useProgressStore.getState().cards, learningDay(new Date(), dayStartHour), {
        targetCards,
      }),
      targetCards,
    ),
  );
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<SessionResult>(EMPTY_TALLY);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);

  const wordId = currentCard(session);
  const word = wordId ? wordsById.get(wordId) : undefined;
  const finished = isSessionFinished(session);

  const playWord = useCallback(
    (rate: number) => {
      if (!word) return;

      setSpeechMessage(null);
      void speak(word.term, { rate, onError: setSpeechMessage });
    },
    [word],
  );

  const playSentence = useCallback(() => {
    if (!word) return;

    setSpeechMessage(null);
    void speak(word.example, { onError: setSpeechMessage });
  }, [word]);

  // Autoplay is unlocked by the tap on "Session starten". In de-en mode it must
  // wait for the reveal — sound on the front would give the answer away.
  useEffect(() => {
    if (!word) return;
    if (direction === 'de-en' && !revealed) return;

    setSpeechMessage(null);
    void speak(word.term, { onError: setSpeechMessage });
  }, [word, direction, revealed]);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!word) return;

      const today = learningDay(new Date(), dayStartHour);
      const existing = cards[word.id] ?? createCardState(word.id, today);
      const updated = review(existing, rating, today, new Date());

      rate(word.id, rating, today, new Date());

      const next = recordAnswer(session, landsInDrillBox(updated));
      const nextTally: SessionResult = {
        presented: next.presented,
        again: tally.again + (rating === 'again' ? 1 : 0),
        unsure: tally.unsure + (rating === 'unsure' ? 1 : 0),
        sure: tally.sure + (rating === 'sure' ? 1 : 0),
      };

      setSession(next);
      setTally(nextTally);
      setRevealed(false);

      if (isSessionFinished(next)) onFinish(nextTally);
    },
    [word, cards, rate, dayStartHour, session, tally, onFinish],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onQuit();

        return;
      }

      if (!revealed) {
        if (event.key === 'Enter') setRevealed(true);
        if (event.key === ' ' && direction === 'en-de') {
          event.preventDefault();
          playWord(1);
        }

        return;
      }

      if (event.key === ' ') {
        event.preventDefault();
        playWord(1);
      }
      if (event.key === '1') handleRate('again');
      if (event.key === '2') handleRate('unsure');
      if (event.key === '3') handleRate('sure');
    }

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [revealed, direction, playWord, handleRate, onQuit]);

  if (finished || !word) {
    return (
      <section className="session session--empty">
        <p>Keine Karten mehr in dieser Session.</p>
        <button type="button" onClick={onQuit}>
          Zurück
        </button>
      </section>
    );
  }

  return (
    <section className="session">
      <header className="session__bar">
        <progress value={session.presented} max={session.target} />
        <span>
          {session.presented} / {session.target}
        </span>
        <button type="button" className="session__quit" onClick={onQuit}>
          Beenden
        </button>
      </header>

      <Flashcard
        word={word}
        direction={direction}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onRate={handleRate}
        onPlayWord={playWord}
        onPlaySentence={playSentence}
        speechMessage={speechMessage}
        assessor={assessor}
      />
    </section>
  );
}

export type { Word };
