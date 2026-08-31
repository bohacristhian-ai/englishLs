import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Flashcard from './Flashcard';
import { getLevel } from '../data/words';
import { AssessmentError } from '../speech/assessment';
import type { PronunciationAssessor, WordAssessment } from '../speech/assessment';
import type { Direction } from '../domain/types';

const WORD = getLevel(1)[0]!;

function assessment(overrides: Partial<WordAssessment> = {}): WordAssessment {
  return {
    recognisedText: WORD.term,
    accuracy: 92,
    overall: 90,
    syllables: WORD.syllables.map((syllable) => ({ syllable, accuracy: 92 })),
    phonemes: [],
    ...overrides,
  };
}

function assessorThat(result: () => Promise<WordAssessment>): PronunciationAssessor {
  return { isAvailable: () => true, assess: result };
}

const noAssessor: PronunciationAssessor = {
  isAvailable: () => false,
  assess: () => Promise.reject(new AssessmentError('nicht eingerichtet')),
};

/** The card plus the little bit of parent state it needs: the reveal. */
function Card({
  assessor,
  direction = 'de-en',
}: {
  assessor: PronunciationAssessor;
  direction?: Direction;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Flashcard
      word={WORD}
      direction={direction}
      revealed={revealed}
      onReveal={() => setRevealed(true)}
      onRate={() => {}}
      onPlayWord={() => {}}
      onPlaySentence={() => {}}
      assessor={assessor}
    />
  );
}

describe('speaking before revealing', () => {
  it('offers the microphone on the de-en front', () => {
    render(<Card assessor={assessorThat(() => Promise.resolve(assessment()))} />);

    expect(screen.getByRole('button', { name: /Aussprechen/ })).toBeInTheDocument();
    // Still no spoiler: no English word, no transcription.
    expect(screen.queryByText(WORD.term)).not.toBeInTheDocument();
    expect(screen.queryByText(`/${WORD.ipaGb}/`)).not.toBeInTheDocument();
  });

  it('turns the card over once the word has been spoken', async () => {
    const user = userEvent.setup();

    render(<Card assessor={assessorThat(() => Promise.resolve(assessment()))} />);

    await user.click(screen.getByRole('button', { name: /Aussprechen/ }));

    expect(await screen.findByRole('heading', { name: WORD.term })).toBeInTheDocument();
    expect(screen.getByText(`/${WORD.ipaGb}/`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sicher/ })).toBeInTheDocument();
  });

  it('keeps the verdict from the front and shows it after the reveal', async () => {
    const user = userEvent.setup();
    const weak = assessment({
      accuracy: 55,
      syllables: WORD.syllables.map((syllable, index) => ({
        syllable,
        accuracy: index === 0 ? 30 : 90,
      })),
    });

    render(<Card assessor={assessorThat(() => Promise.resolve(weak))} />);

    await user.click(screen.getByRole('button', { name: /Aussprechen/ }));

    expect(await screen.findByText('Da war einiges daneben')).toBeInTheDocument();
    expect(screen.getByText(`Schwächste Silbe: „${WORD.syllables[0]}“`)).toBeInTheDocument();
  });

  it('does not reveal when the recording failed', async () => {
    const user = userEvent.setup();

    render(
      <Card
        assessor={assessorThat(() => Promise.reject(new AssessmentError('Kein Mikrofon.')))}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Aussprechen/ }));

    expect(await screen.findByText('Kein Mikrofon.')).toBeInTheDocument();
    // A failed attempt is no attempt — the answer stays hidden.
    expect(screen.queryByRole('heading', { name: WORD.term })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auflösen' })).toBeInTheDocument();
  });

  it('leaves "Auflösen" as the way out of a card', async () => {
    const user = userEvent.setup();

    render(<Card assessor={assessorThat(() => Promise.resolve(assessment()))} />);

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));

    expect(screen.getByRole('heading', { name: WORD.term })).toBeInTheDocument();
    // Nothing was recorded, so there is nothing to report.
    expect(screen.queryByText('Sauber ausgesprochen')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aussprache prüfen/ })).toBeInTheDocument();
  });

  it('falls back to plain revealing without a configured assessor', () => {
    render(<Card assessor={noAssessor} />);

    expect(screen.queryByRole('button', { name: /Aussprechen/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auflösen' })).toHaveClass('card__reveal');
    expect(screen.getByRole('button', { name: 'Auflösen' })).not.toHaveClass(
      'card__reveal--secondary',
    );
  });

  it('offers the microphone on the en-de front as well', () => {
    render(
      <Card assessor={assessorThat(() => Promise.resolve(assessment()))} direction="en-de" />,
    );

    expect(screen.getByRole('button', { name: /Aussprechen/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: WORD.term })).toBeInTheDocument();
  });
});
