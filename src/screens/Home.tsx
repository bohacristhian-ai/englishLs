import { useMemo, useState } from 'react';

import { availableLevels, getLevel } from '../data/words';
import { learningDay } from '../domain/dates';
import { countAvailableNew, countDue, nextDueDay } from '../domain/scheduler';
import { DEFAULT_SESSION_SIZE } from '../domain/scheduler';
import type { Direction } from '../domain/types';
import { useProgressStore } from '../store/progressStore';
import { useSettingsStore } from '../store/settingsStore';

export interface StartOptions {
  level: number;
  direction: Direction;
  targetCards: number;
  /** A run that changes nothing — for when there is genuinely nothing due. */
  practice: boolean;
}

interface HomeProps {
  onStart: (options: StartOptions) => void;
  onShowStats: () => void;
  onShowSettings: () => void;
}

const SIZES = [10, DEFAULT_SESSION_SIZE, 30] as const;

export const LEVEL_THEMES: Readonly<Record<number, string>> = {
  1: 'Grundlagen',
  2: 'Arbeit & Beruf',
  3: 'Bildung & Lernen',
  4: 'Gefühle & Persönlichkeit',
  5: 'Gesellschaft & Politik',
  6: 'Umwelt & Natur',
  7: 'Technologie & Medien',
  8: 'Gesundheit & Körper',
  9: 'Reisen & Kultur',
  10: 'Wirtschaft & Geld',
};

function formatDay(day: string): string {
  const [year, month, dayOfMonth] = day.split('-');

  return `${dayOfMonth}.${month}.${year}`;
}

export default function Home({ onStart, onShowStats, onShowSettings }: HomeProps) {
  const cards = useProgressStore((state) => state.cards);
  const streak = useProgressStore((state) => state.streak.current);

  const { level, direction, sessionSize, dayStartHour, update } = useSettingsStore();
  const [chosenLevel, setChosenLevel] = useState(level);
  const [chosenDirection, setChosenDirection] = useState<Direction>(direction);
  const [chosenSize, setChosenSize] = useState(sessionSize);

  const today = learningDay(new Date(), dayStartHour);
  const words = useMemo(() => getLevel(chosenLevel), [chosenLevel]);

  const due = countDue(words, cards, today);
  const fresh = countAvailableNew(words, cards, today);
  const nothingToDo = due + fresh === 0;
  const nextDay = nextDueDay(cards, today);

  const start = (practice: boolean): void => {
    update({ level: chosenLevel, direction: chosenDirection, sessionSize: chosenSize });
    onStart({
      level: chosenLevel,
      direction: chosenDirection,
      targetCards: chosenSize,
      practice,
    });
  };

  return (
    <section className="home">
      <div className="home__status">
        <p className="home__due">
          <strong>{due}</strong> fällig · <strong>{fresh}</strong> neu
        </p>
        <p className="home__streak">
          {streak === 0 ? 'Noch kein Streak' : `Streak ${streak} ${streak === 1 ? 'Tag' : 'Tage'}`}
        </p>
      </div>

      {nothingToDo && (
        /* The moment habits die is an empty page. Say when to come back, and
           offer something to do in the meantime that costs nothing. */
        <div className="home__done">
          <p>
            <strong>Für heute erledigt.</strong>
          </p>
          <p className="home__next">
            {nextDay
              ? `Nächste Wiederholung am ${formatDay(nextDay)}.`
              : 'In diesem Level ist noch nichts geplant.'}
          </p>
          <button type="button" className="home__practice" onClick={() => start(true)}>
            Freies Üben — ohne Wertung
          </button>
        </div>
      )}

      <fieldset className="setup__group">
        <legend>Richtung</legend>
        <label>
          <input
            type="radio"
            name="direction"
            checked={chosenDirection === 'de-en'}
            onChange={() => setChosenDirection('de-en')}
          />
          Deutsch → Englisch <span className="setup__note">produktiv, Standard</span>
        </label>
        <label>
          <input
            type="radio"
            name="direction"
            checked={chosenDirection === 'en-de'}
            onChange={() => setChosenDirection('en-de')}
          />
          Englisch → Deutsch <span className="setup__note">rezeptiv</span>
        </label>
      </fieldset>

      <fieldset className="setup__group">
        <legend>Level</legend>
        <ul className="home__levels">
          {availableLevels().map((value) => {
            const started = getLevel(value).filter((word) => cards[word.id]).length;

            return (
              <li key={value}>
                <button
                  type="button"
                  className={value === chosenLevel ? 'level level--active' : 'level'}
                  onClick={() => setChosenLevel(value)}
                  aria-pressed={value === chosenLevel}
                >
                  <span className="level__number">{value}</span>
                  <span className="level__theme">{LEVEL_THEMES[value]}</span>
                  <span className="level__progress">{started}/50</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="setup__group">
        <legend>Karten</legend>
        <div className="setup__sizes">
          {SIZES.map((size) => (
            <label key={size}>
              <input
                type="radio"
                name="size"
                checked={chosenSize === size}
                onChange={() => setChosenSize(size)}
              />
              {size}
            </label>
          ))}
        </div>
      </fieldset>

      {/* This tap is also what unlocks speech on iOS Safari. */}
      <button
        type="button"
        className="setup__start"
        onClick={() => start(false)}
        disabled={nothingToDo}
      >
        Session starten
      </button>

      <nav className="home__nav">
        <button type="button" onClick={onShowStats}>
          Statistik
        </button>
        <button type="button" onClick={onShowSettings}>
          Einstellungen
        </button>
      </nav>
    </section>
  );
}
