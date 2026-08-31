import { BOX_INTERVAL_DAYS } from '../domain/leitner';
import { boxCounts, consolidatedCount } from '../domain/progress';
import type { Box } from '../domain/types';
import { useProgressStore } from '../store/progressStore';

interface StatsProps {
  onBack: () => void;
}

const HISTORY_DAYS = 14;
const BOXES: Box[] = [1, 2, 3, 4, 5];

function intervalLabel(box: Box): string {
  const days = BOX_INTERVAL_DAYS[box];

  if (days === 0) return 'gleicher Tag';

  return days === 1 ? 'nach 1 Tag' : `nach ${days} Tagen`;
}

export default function Stats({ onBack }: StatsProps) {
  const cards = useProgressStore((state) => state.cards);
  const history = useProgressStore((state) => state.history);
  const streak = useProgressStore((state) => state.streak);

  const counts = boxCounts(cards);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const consolidated = consolidatedCount(cards);
  const recent = history.slice(-HISTORY_DAYS);
  const busiest = Math.max(1, ...recent.map((entry) => entry.reviewed));

  return (
    <section className="stats">
      <h2>Statistik</h2>

      <dl className="summary__stats">
        <div>
          <dt>Begonnen</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>Gefestigt</dt>
          <dd>{consolidated}</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{streak.current}</dd>
        </div>
        <div>
          <dt>Bester Streak</dt>
          <dd>{streak.longest}</dd>
        </div>
      </dl>

      <h3 className="stats__heading">Verteilung über die Fächer</h3>
      <ul className="boxes">
        {BOXES.map((box) => (
          <li key={box} className="boxes__row">
            <span className="boxes__label">
              Fach {box}
              <span className="boxes__interval">
                {intervalLabel(box)}
              </span>
            </span>
            <span
              className={counts[box] === 0 ? 'boxes__bar boxes__bar--empty' : 'boxes__bar'}
              style={{ width: `${total === 0 ? 0 : (counts[box] / total) * 100}%` }}
            />
            <span className="boxes__count">{counts[box]}</span>
          </li>
        ))}
      </ul>

      <h3 className="stats__heading">Letzte {HISTORY_DAYS} Lerntage</h3>
      {recent.length === 0 ? (
        <p className="stats__empty">Noch keine Lerntage aufgezeichnet.</p>
      ) : (
        <ul className="history">
          {recent.map((entry) => (
            <li key={entry.day} className="history__row">
              <span className="history__day">{entry.day.slice(5).replace('-', '.')}</span>
              <span
                className="history__bar"
                style={{ width: `${(entry.reviewed / busiest) * 100}%` }}
              />
              <span className="history__count">
                {entry.correct}/{entry.reviewed}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="setup__start" onClick={onBack}>
        Zurück
      </button>
    </section>
  );
}
