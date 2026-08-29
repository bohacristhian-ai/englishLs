import { useState } from 'react';

import { availableLevels } from '../data/words';
import { DEFAULT_SESSION_SIZE } from '../domain/scheduler';
import type { Direction } from '../domain/types';

export interface SessionOptions {
  level: number;
  direction: Direction;
  targetCards: number;
}

interface SessionSetupProps {
  initial: SessionOptions;
  onStart: (options: SessionOptions) => void;
}

const SIZES = [10, DEFAULT_SESSION_SIZE, 30] as const;

const LEVEL_THEMES: Readonly<Record<number, string>> = {
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

export default function SessionSetup({ initial, onStart }: SessionSetupProps) {
  const [level, setLevel] = useState(initial.level);
  const [direction, setDirection] = useState<Direction>(initial.direction);
  const [targetCards, setTargetCards] = useState(initial.targetCards);

  return (
    <section className="setup">
      <h2>Session starten</h2>

      <fieldset className="setup__group">
        <legend>Richtung</legend>
        <label>
          <input
            type="radio"
            name="direction"
            checked={direction === 'de-en'}
            onChange={() => setDirection('de-en')}
          />
          Deutsch → Englisch <span className="setup__note">produktiv, Standard</span>
        </label>
        <label>
          <input
            type="radio"
            name="direction"
            checked={direction === 'en-de'}
            onChange={() => setDirection('en-de')}
          />
          Englisch → Deutsch <span className="setup__note">rezeptiv</span>
        </label>
      </fieldset>

      <fieldset className="setup__group">
        <legend>Level</legend>
        <select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
          {availableLevels().map((value) => (
            <option key={value} value={value}>
              Level {value} — {LEVEL_THEMES[value] ?? ''}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="setup__group">
        <legend>Karten</legend>
        <div className="setup__sizes">
          {SIZES.map((size) => (
            <label key={size}>
              <input
                type="radio"
                name="size"
                checked={targetCards === size}
                onChange={() => setTargetCards(size)}
              />
              {size}
            </label>
          ))}
        </div>
      </fieldset>

      {/* The tap that starts the session is also what unlocks speech on iOS
          Safari, which blocks the first utterance without a user gesture. */}
      <button
        type="button"
        className="setup__start"
        onClick={() => onStart({ level, direction, targetCards })}
      >
        Session starten
      </button>
    </section>
  );
}
