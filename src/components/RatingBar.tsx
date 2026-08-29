import type { Rating } from '../domain/types';

interface RatingBarProps {
  onRate: (rating: Rating) => void;
}

const BUTTONS: ReadonlyArray<{ rating: Rating; label: string; key: string; modifier: string }> = [
  { rating: 'again', label: 'Nochmal', key: '1', modifier: 'again' },
  { rating: 'unsure', label: 'Unsicher', key: '2', modifier: 'unsure' },
  { rating: 'sure', label: 'Sicher', key: '3', modifier: 'sure' },
];

/**
 * The three-step self-assessment.
 *
 * The question is deliberately concrete rather than "Wusstest du es?" — people
 * judge a checkable question far more reliably than a feeling, and for
 * pronunciation the feeling is the least trustworthy part. Do not soften this
 * wording; it is one of only two mitigations the MVP has (PLAN.md §13.1).
 */
export default function RatingBar({ onRate }: RatingBarProps) {
  return (
    <div className="rating">
      <p className="rating__question">Betonung auf der richtigen Silbe? Endungen reduziert?</p>

      <div className="rating__buttons">
        {BUTTONS.map(({ rating, label, key, modifier }) => (
          <button
            key={rating}
            type="button"
            className={`rating__button rating__button--${modifier}`}
            onClick={() => onRate(rating)}
          >
            {label}
            <span className="rating__key" aria-hidden="true">
              {key}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
